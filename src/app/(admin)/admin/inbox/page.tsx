import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { updateMessageStatusAction, sendQuickReplyAction } from "@/app/(admin)/actions";
import { getMessagesInbox } from "@/lib/cms";
import { emailConfigured } from "@/lib/email";


const STATUSES = ["new", "read", "replied", "spam"] as const;
const tone: Record<string, string> = { new: "acc", read: "", replied: "ok", spam: "bad" };

async function InboxInner({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; detail?: string }>;
}) {
  const sp = await searchParams;
  const rows = await getMessagesInbox();

  const errors: Record<string, string> = {
    empty: "Write a reply first.",
    notfound: "That message no longer exists.",
    email: sp.detail
      ? `Email failed: ${sp.detail}`
      : "Email failed — check RESEND_API_KEY in .env.local.",
  };

  return (
    <AdminShell heading="Inbox">
      <p style={{ color: "var(--mut2)", fontSize: 14, marginBottom: 14 }}>
        Messages from the contact form. Mark status as you handle them — or
        reply directly by email (the message is marked “replied”).
      </p>
      {sp.sent ? <p className="chip ok" style={{ marginBottom: 12 }}>Reply sent.</p> : null}
      {sp.error ? <p className="chip bad" style={{ marginBottom: 12 }}>{errors[sp.error] ?? "Something went wrong."}</p> : null}
      {!emailConfigured() ? (
        <p className="note" style={{ marginBottom: 12 }}>
          Quick reply needs email: add <code>RESEND_API_KEY</code> to .env.local
          (see System page). Status buttons work without it.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <div className="c">No messages yet.</div>
      ) : (
        <div className="g" style={{ maxWidth: 760 }}>
          {rows.map((m) => (
            <div className="c" key={m.id}>
              <h3>
                {m.name}
                <span className={"chip " + (tone[m.status] ?? "")}>{m.status}</span>
              </h3>
              <p style={{ color: "var(--mut2)", fontSize: 13 }}>{m.email}</p>
              <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{m.message}</p>
              <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {STATUSES.map((s) => (
                  <form key={s} action={updateMessageStatusAction.bind(null, m.id, s)}>
                    <button
                      type="submit"
                      className={"btn s" + (m.status === s ? " p" : "")}
                    >
                      {s}
                    </button>
                  </form>
                ))}
              </div>
              <form
                action={sendQuickReplyAction.bind(null, m.id)}
                style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12, display: "grid", gap: 8 }}
              >
                <label style={{ fontSize: 13 }}>
                  Quick reply by email to {m.email}
                  <textarea name="reply" rows={3} placeholder="Thanks for reaching out — ..." />
                </label>
                <div>
                  <button type="submit" className="btn s p">Send reply</button>
                </div>
              </form>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

export default function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; detail?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <InboxInner searchParams={searchParams} />
    </Suspense>
  );
}
