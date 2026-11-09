import "server-only";

/**
 * Stage 6 item 4 — Cloudflare Turnstile server-side verification.
 *
 * Config: NEXT_PUBLIC_TURNSTILE_SITE_KEY (widget) + TURNSTILE_SECRET_KEY
 * (server). Behaviour when the secret is missing:
 *   - development: the form passes (with devBypass=true so the UI can show
 *     a clear note) — keeps local flows usable without keys;
 *   - production: the submission is REJECTED (safe default — the form shows
 *     a clear message until keys are configured).
 */
export function turnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export type TurnstileResult = { ok: boolean; reason?: string; devBypass?: boolean };

export async function verifyTurnstile(token: string, ip: string): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    if (process.env.NODE_ENV !== "production") {
      return { ok: true, devBypass: true };
    }
    return { ok: false, reason: "not_configured" };
  }
  if (!token) return { ok: false, reason: "missing_token" };
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const json = (await res.json()) as { success?: boolean };
    return json.success ? { ok: true } : { ok: false, reason: "invalid_token" };
  } catch {
    return { ok: false, reason: "network" };
  }
}
