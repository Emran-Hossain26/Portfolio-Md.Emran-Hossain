import { Suspense } from "react";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { updateMessageStatusAction, sendQuickReplyAction } from "@/app/(admin)/actions";
import { getMessagesInbox } from "@/lib/cms";
import { emailConfigured } from "@/lib/email";

const STATUSES = ["new", "read", "replied", "spam"] as const;
const tone: Record<string, string> = { new: "acc", read: "", replied: "ok", spam: "bad" };

function ago(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

async function InboxInner({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; detail?: string; msg?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const rows = await getMessagesInbox();
  const selectedId = sp.msg ?? rows[0]?.id ?? "";
  const selected = rows.find((m) => m.id === selectedId) ?? rows[0] ?? null;

  const errors: Record<string, string> = {
    empty: "Write a reply first.",
    notfound: "That message no longer exists.",
    email: sp.detail
      ? `Email failed: ${sp.detail}`
      : "Email failed — check RESEND_API_KEY in .env.local.",
  };

  return (
    <AdminShell heading="Inbox">
      <div className="hd">
        <p>Messages from the contact and quote forms. Mark status as you handle them — or reply directly by email.</p>
        <Link className="btn" href="/api/admin/messages-csv">Export CSV</Link>
      </div>
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
        /* Mockup slide "Inbox": two-pane — message list + detail with actions */
        <div className="inb">
          <div className="c" style={{ padding: 0, overflow: "hidden" }}>
            {rows.map((m) => (
              <Link
                key={m.id}
                href={`/admin/inbox?msg=${m.id}`}
                className="mi"
                style={{
                  display: "block",
                  textAlign: "left",
                  textDecoration: "none",
                  color: "inherit",
                  borderBottom: "1px solid var(--line)",
                  background: m.id === selected?.id ? "color-mix(in srgb, var(--acc) 10%, var(--card))" : "transparent",
                }}
              >
                <span
                  className="dot"
                  style={{
                    display: m.status === "new" ? "inline-block" : "none",
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    background: "var(--acc)",
                    marginRight: 6,
                  }}
                />
                <b>{m.name}</b>
                <small style={{ display: "block", color: "var(--mut2)", fontSize: 12.5 }}>
                  {m.message.slice(0, 60)}{m.message.length > 60 ? "…" : ""} · {ago(m.created_at)} ago
                </small>
              </Link>
            ))}
          </div>

          {selected ? (
            <div className="c">
              <h3 style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ flex: 1 }}>Message from {selected.name}</span>
                <span className={"chip " + (tone[selected.status] ?? "")}>{selected.status}</span>
              </h3>
              <p style={{ color: "var(--mut2)", fontSize: 13 }}>
                {selected.email} · {ago(selected.created_at)} ago
              </p>
              <p style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>{selected.message}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                {STATUSES.map((s) => (
                  <form key={s} action={updateMessageStatusAction.bind(null, selected.id, s)}>
                    <button type="submit" className={"btn" + (selected.status === s ? " p" : "")}>
                      {s === "new" ? "Mark new" : "Mark " + s}
                    </button>
                  </form>
                ))}
              </div>
              <form
                action={sendQuickReplyAction.bind(null, selected.id)}
                style={{ marginTop: 14, display: "grid", gap: 8 }}
              >
                <label className="f" style={{ fontSize: 13 }}>
                  Quick reply (sent by email) → {selected.email}
                  <textarea name="reply" rows={3} placeholder="Hi, thanks for reaching out…" />
                </label>
                <div>
                  <button type="submit" className="btn p">Send reply</button>
                </div>
              </form>
              <div className="note">Rate limit and honeypot are on. Spam is hidden from the unread count.</div>
            </div>
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}

export default function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; detail?: string; msg?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <InboxInner searchParams={searchParams} />
    </Suspense>
  );
}
