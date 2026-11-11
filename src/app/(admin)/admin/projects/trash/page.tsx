import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProjectsManager } from "@/components/admin/ProjectsManager";
import { fetchTrashedProjects, toManagerRow } from "../data";

export default async function AdminProjectsTrashPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const rows = (await fetchTrashedProjects()).map(toManagerRow);

  return (
    <AdminShell current="/admin/projects/trash" heading="Trash">
      {sp.error === "notrashed" && (
        <div className="c" style={{ borderColor: "var(--bad)", marginBottom: 12 }}>
          Permanent delete is only allowed for trashed rows.
        </div>
      )}
      <ProjectsManager rows={rows} mode="trash" />
    </AdminShell>
  );
}
