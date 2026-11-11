import { CmsRevisions } from "../../../cms/revisions-view";

export default async function ProjectRevisionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CmsRevisions module="projects" id={id} />;
}
