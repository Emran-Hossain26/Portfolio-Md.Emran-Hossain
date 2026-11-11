import { CmsDashboard } from "../cms/view";

export default function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; saved?: string; error?: string }>;
}) {
  return <CmsDashboard module="projects" base="/admin/projects" searchParams={searchParams} />;
}
