import "server-only";
import { createHash } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * Stage 6 security: durable login / 2FA rate limiting + lockout backed by
 * the public.login_attempts table (NOT in-memory — survives restarts and
 * serverless instances). Progressive delay once the threshold is crossed.
 *
 * Identifier = account identity (email or resolved username) + request IP,
 * so both credential-stuffing per account and spraying per IP are throttled.
 */

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 5;
/** Progressive lockout: 30s × 2^(failures − MAX_FAILURES), capped at 15 min. */
function lockoutSeconds(failures: number): number {
  return Math.min(15 * 60, 30 * 2 ** (failures - MAX_FAILURES));
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export type AttemptVerdict = {
  locked: boolean;
  retryAfterSeconds: number;
  failures: number;
};

/** How many failures are on record for this identifier+IP window? */
async function failuresInWindow(db: ReturnType<typeof createServiceClient>, identifier: string, ip: string): Promise<number> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { count } = await db
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("identifier", identifier)
    .eq("ip", ip)
    .eq("success", false)
    .gte("created_at", since);
  return count ?? 0;
}

/**
 * Check the lockout BEFORE attempting authentication. Progressive: the
 * longer the abuse continues, the longer the wait (capped at 15 minutes).
 */
export async function checkLockout(identifier: string, ip: string): Promise<AttemptVerdict> {
  try {
    const db = createServiceClient();
    const failures = await failuresInWindow(db, identifier, ip);
    if (failures < MAX_FAILURES) return { locked: false, retryAfterSeconds: 0, failures };
    const last = await db
      .from("login_attempts")
      .select("created_at")
      .eq("identifier", identifier)
      .eq("ip", ip)
      .eq("success", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastAt = last?.data?.created_at ? new Date(last.data.created_at as string).getTime() : Date.now();
    const waitFor = lockoutSeconds(failures) * 1000;
    const remaining = Math.max(0, Math.ceil((lastAt + waitFor - Date.now()) / 1000));
    return { locked: remaining > 0, retryAfterSeconds: remaining, failures };
  } catch {
    // Store unavailable: do not leak a bypass — treat as locked briefly.
    return { locked: true, retryAfterSeconds: 30, failures: MAX_FAILURES };
  }
}

/** Record an attempt (success or failure) and return the new failure count. */
export async function recordAttempt(identifier: string, ip: string, success: boolean): Promise<number> {
  try {
    const db = createServiceClient();
    await db.from("login_attempts").insert({ identifier, ip, success });
    if (success) return 0;
    return await failuresInWindow(db, identifier, ip);
  } catch {
    return 0;
  }
}

/** True while the identifier+IP is in the progressive-lockout window. */
export async function isLockedOut(identifier: string, ip: string): Promise<boolean> {
  return (await checkLockout(identifier, ip)).locked;
}
