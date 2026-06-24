import { AdminPayrollRun } from "@/components/Admin/Payroll/AdminPayrollRun";
import { redirect } from "next/navigation";

export default async function RunPayrollPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (role === "employee") redirect(`/${role}/payroll/overview`);
  return <AdminPayrollRun />;
}
