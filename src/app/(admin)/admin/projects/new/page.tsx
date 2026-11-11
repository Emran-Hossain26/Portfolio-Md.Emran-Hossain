import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { toFormRow } from "../data";

export default async function AdminProjectNewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  return (
    <AdminShell current="/admin/projects" heading="Add new project">
      <ProjectForm id="__new" row={toFormRow(null)} error={sp.error} isNew />
    </AdminShell>
  );
}
