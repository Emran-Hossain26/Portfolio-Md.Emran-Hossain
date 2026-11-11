import { CmsRevisions } from "../../../cms/revisions-view";

export default async function ServiceRevisionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CmsRevisions module="services" id={id} />;
}
