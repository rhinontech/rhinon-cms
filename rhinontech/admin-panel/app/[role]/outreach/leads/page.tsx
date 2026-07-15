import { redirect } from "next/navigation";

export default async function OutreachLeadsRedirect({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  redirect(`/${role}/crm`);
}
