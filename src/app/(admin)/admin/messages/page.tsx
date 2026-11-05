import { AdminShell } from "@/components/admin/AdminShell";
import { updateMessageStatusAction } from "@/app/(admin)/actions";
import { getMessagesInbox } from "@/lib/cms";

const STATUSES = ["new", "read", "replied", "spam"] as const;

export default async function MessagesPage() {
  const rows = await getMessagesInbox();
  return (
    <AdminShell current="/admin/messages" heading="Inbox (contact messages)">
      <p className="admin-note">Messages submitted via the contact form. Mark status as you handle them.</p>
      {rows.length === 0 ? (
        <p className="admin-note">No messages yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {rows.map((m) => (
            <div className="card" key={m.id}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <b>{m.name}</b>
                <span className="mute" style={{ fontSize: 13 }}>{m.created_at}</span>
              </div>
              <p className="mute" style={{ fontSize: 13 }}>{m.email}</p>
              <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{m.message}</p>
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {STATUSES.map((s) => (
                  <form key={s} action={updateMessageStatusAction.bind(null, m.id, s)}>
                    <button type="submit" className={"btn" + (m.status === s ? " p" : "")}>
                      {s}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
