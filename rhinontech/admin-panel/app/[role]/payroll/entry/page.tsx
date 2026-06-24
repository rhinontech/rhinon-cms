import { AdminPayrollEntry } from "@/components/Admin/Payroll/AdminPayrollEntry";
import { redirect } from "next/navigation";

export default async function PayrollEntryPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (role === "employee") redirect(`/${role}/payroll/overview`);
  return <AdminPayrollEntry />;
}
