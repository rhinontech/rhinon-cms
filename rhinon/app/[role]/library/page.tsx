import { redirect } from "next/navigation";

export default async function LibraryPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  redirect(`/${role}/library/all`);
}


