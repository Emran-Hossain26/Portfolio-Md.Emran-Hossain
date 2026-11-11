import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProjectsManager } from "@/components/admin/ProjectsManager";
import { fetchAdminProjects, toManagerRow } from "../data";

export default async function AdminProjectsHiddenPage() {
  await requireAdmin();
  const { rows } = await fetchAdminProjects();
  const hidden = rows.filter((r) => r.published === false).map(toManagerRow);

  return (
    <AdminShell current="/admin/projects/hidden" heading="Hidden projects">
      <p className="admin-note">
        Rows with <b>published = false</b> — never on the home, project pages, sitemap or structured data.
        Use “Show” on any row to put it back on the portfolio.
      </p>
      <ProjectsManager rows={hidden} mode="hidden" />
    </AdminShell>
  );
}
