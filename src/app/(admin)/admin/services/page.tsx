import { CmsDashboard } from "../cms/view";

export default function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; saved?: string; error?: string }>;
}) {
  return <CmsDashboard module="services" base="/admin/services" searchParams={searchParams} />;
}
