import { redirect } from "next/navigation";

/** "All projects" and "Projects" are one list now; old links land on it. */
export default async function ClientsProjectsMovedPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  redirect(`/${role}/work/projects`);
}
