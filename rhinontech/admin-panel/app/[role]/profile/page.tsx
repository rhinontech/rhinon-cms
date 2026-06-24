import { redirect } from "next/navigation";

export default async function ProfileRoot({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  redirect(`/${role}/profile/info`);
}
