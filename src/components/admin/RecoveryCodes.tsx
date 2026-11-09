"use client";

import { useActionState } from "react";
import { generateRecoveryCodesAction } from "@/app/(admin)/actions";

type State = { codes: string[] } | { error: string } | null;

/**
 * Stage 6 item 3 — 2FA recovery codes. Generating replaces every previous
 * code (hashed at rest); the plain codes are shown exactly once.
 */
export function RecoveryCodes() {
  const [state, action, pending] = useActionState(generateRecoveryCodesAction, null);

  return (
    <div style={{ marginTop: 10 }}>
      <form action={action}>
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Generating…" : "Generate recovery codes"}
        </button>
      </form>
      {state && "error" in state ? (
        <p className="chip bad" style={{ marginTop: 8 }}>{state.error}</p>
      ) : null}
      {state && "codes" in state ? (
        <div className="note" style={{ marginTop: 8 }}>
          <b style={{ display: "block", marginBottom: 6 }}>
            Save these now — they are shown only once (each works a single time):
          </b>
          <code style={{ display: "grid", gap: 2, fontSize: 13 }}>
            {state.codes.map((c) => <span key={c}>{c}</span>)}
          </code>
        </div>
      ) : null}
    </div>
  );
}
