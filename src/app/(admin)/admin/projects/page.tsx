import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProjectsManager } from "@/components/admin/ProjectsManager";
import { restoreProjectAction } from "./actions";
import { fetchAdminProjects, toManagerRow } from "./data";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ trashed?: string; error?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const { rows, hasU2 } = await fetchAdminProjects();

  return (
    <AdminShell current="/admin/projects" heading="All projects">
      <p className="admin-note">
        Status lifecycle (running / completed / planned / paused), drag reorder, per-row actions.
        “published” stays the visible-on-portfolio switch; Trash is a soft delete with restore.
      </p>

      {sp.trashed && (
        <div className="c" style={{ borderColor: "var(--acc2)", marginBottom: 12, display: "flex", gap: 12, alignItems: "center" }}>
          <span>Moved to Trash. Undo?</span>
          <form action={restoreProjectAction.bind(null, sp.trashed)}>
            <button className="btn s p" type="submit">Restore project</button>
          </form>
        </div>
      )}
      {sp.error === "notrashed" && (
        <div className="c" style={{ borderColor: "var(--bad)", marginBottom: 12 }}>
          Permanent delete is only allowed for trashed rows.
        </div>
      )}

      <ProjectsManager rows={rows.map(toManagerRow)} mode="all" />

      {!hasU2 && (
        <p className="admin-note" style={{ marginTop: 14 }}>
          Pre-migration mode: status/trash columns arrive with <b>20261117_projects_admin.sql</b> —
          until then the list shows the baseline columns.
        </p>
      )}
    </AdminShell>
  );
}
