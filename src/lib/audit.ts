import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * Best-effort audit trail (MISSING-TASKS A7). Every admin mutation calls
 * this after its write; the insert itself must never break a save — the
 * table may not exist until the migration runs, and that is fine.
 */
export async function logAdminAction(
  actor: { id?: string | null; email?: string | null } | null | undefined,
  action: string,
  entityType?: string | null,
  entityId?: string | number | null,
  oldValue?: unknown,
  newValue?: unknown,
): Promise<void> {
  try {
    await createServiceClient().from("audit_log").insert({
      user_id: actor?.id ?? null,
      user_email: actor?.email ?? null,
      action,
      entity_type: entityType ?? null,
      entity_id: entityId == null ? null : String(entityId),
      old_value: oldValue === undefined ? null : oldValue,
      new_value: newValue === undefined ? null : newValue,
    });
  } catch {
    // Silent by design — see docstring.
  }
}

/** Compact JSON for audit rows: keeps big payloads (post bodies) small. */
export function auditValue(value: unknown, max = 2000): unknown {
  if (value === undefined || value === null) return null;
  try {
    const json = JSON.stringify(value);
    if (json.length <= max) return value;
    return { truncated: true, preview: json.slice(0, max) };
  } catch {
    return { unserializable: true };
  }
}
