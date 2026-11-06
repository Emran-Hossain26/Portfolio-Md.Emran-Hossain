import { AdminShell } from "@/components/admin/AdminShell";
import { updateMessageStatusAction } from "@/app/(admin)/actions";
import { getMessagesInbox } from "@/lib/cms";

const STATUSES = ["new", "read", "replied", "spam"] as const;
const tone: Record<string, string> = { new: "acc", read: "", replied: "ok", spam: "bad" };

export default async function InboxPage() {
  const rows = await getMessagesInbox();
  return (
    <AdminShell heading="Inbox">
      <p style={{ color: "var(--mut2)", fontSize: 14, marginBottom: 14 }}>
        Messages from the contact form. Mark status as you handle them.
      </p>
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
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
