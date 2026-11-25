import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ActionButton } from "@/components/admin/ActionButton";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";
import { deleteCommentAction, setCommentStatusAction } from "./actions";

type Row = {
  id: string;
  post_slug: string;
  parent_id: string | null;
  name: string;
  body: string;
  status: "pending" | "approved" | "hidden";
  created_at: string;
};

export default async function AdminCommentsPage() {
  await requireAdmin();

  let rows: Row[] = [];
  let missing = false;
  if (adminConfigured()) {
    const { data, error } = await createServiceClient()
      .from("blog_comments")
      .select("id,post_slug,parent_id,name,body,status,created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) missing = true;
    rows = (data ?? []) as Row[];
  }
  const order = { pending: 0, approved: 1, hidden: 2 } as const;
  rows.sort((a, b) => order[a.status] - order[b.status]);
  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <AdminShell current="/admin/comments" heading="Blog comments">
      <p className="admin-note">
        Visitors can comment on posts and reply to approved comments. Nothing shows publicly until you
        approve it. {pending > 0 ? <b>{pending} waiting for approval.</b> : "Nothing is waiting."}
      </p>
      {missing ? (
        <p className="admin-note" role="alert">
          The comments tables are not created yet. Run supabase/migrations/20261125_blog_engagement.sql
          in the Supabase SQL editor.
        </p>
      ) : null}
      {rows.length === 0 && !missing ? <p className="admin-note">No comments yet.</p> : null}
      {rows.map((r) => (
        <div key={r.id} className="card" style={{ marginBottom: 12, padding: 16 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
            <b>{r.name}</b>
            <span className="mute" style={{ fontSize: 13 }}>
              on <a href={`/blog/${r.post_slug}`} target="_blank" rel="noopener noreferrer">{r.post_slug}</a>
              {r.parent_id ? " · reply" : ""} · {new Date(r.created_at).toLocaleString("en-GB")}
            </span>
            <span className="mute" style={{ fontSize: 13 }}>[{r.status}]</span>
          </div>
          <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: "8px 0 12px" }}>{r.body}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {r.status !== "approved" ? (
              <form action={setCommentStatusAction.bind(null, r.id, "approved")}>
                <ActionButton pendingLabel="Approving…">Approve</ActionButton>
              </form>
            ) : null}
            {r.status !== "hidden" ? (
              <form action={setCommentStatusAction.bind(null, r.id, "hidden")}>
                <ActionButton pendingLabel="Hiding…">Hide</ActionButton>
              </form>
            ) : null}
            <form action={deleteCommentAction.bind(null, r.id)}>
              <ActionButton pendingLabel="Deleting…" confirm="Delete this comment (and its replies) permanently?">
                Delete
              </ActionButton>
            </form>
          </div>
        </div>
      ))}
    </AdminShell>
  );
}
