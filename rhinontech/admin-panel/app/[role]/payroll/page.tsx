import { redirect } from "next/navigation";

export default async function PayrollRoot({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  redirect(`/${role}/payroll/overview`);
}
