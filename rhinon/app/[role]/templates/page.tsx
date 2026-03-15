import { redirect } from "next/navigation";

export default async function TemplatesPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  redirect(`/${role}/templates/all`);
}


