import { CmsDashboard } from "../cms/view";

export default function AdminExperiencePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; saved?: string; error?: string }>;
}) {
  return <CmsDashboard module="experience" base="/admin/experience" searchParams={searchParams} />;
}
