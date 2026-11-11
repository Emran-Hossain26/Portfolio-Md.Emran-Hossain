import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProjectsManager } from "@/components/admin/ProjectsManager";
import { fetchAdminProjects, toManagerRow } from "../data";

export default async function AdminProjectsRunningPage() {
  await requireAdmin();
  const { rows } = await fetchAdminProjects();
  const running = rows.filter((r) => String(r.status ?? "completed") === "running").map(toManagerRow);

  return (
    <AdminShell current="/admin/projects/running" heading="Running projects">
      <p className="admin-note">
        Projects with status <b>running</b> — these get the public “Running” badge on the site.
      </p>
      <ProjectsManager rows={running} mode="running" />
    </AdminShell>
  );
}
