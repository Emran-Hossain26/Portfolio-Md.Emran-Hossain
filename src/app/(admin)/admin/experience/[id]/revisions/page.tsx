import { CmsRevisions } from "../../../cms/revisions-view";

export default async function ExperienceRevisionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CmsRevisions module="experience" id={id} />;
}
