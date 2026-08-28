import { ProjectWorkspace } from "@/components/Admin/Work/Project/ProjectWorkspace";

export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ role: string; id: string }>;
}) {
  const { role, id } = await params;
  return <ProjectWorkspace projectId={id} roleSlug={role} />;
}
