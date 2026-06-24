import { AdminPayrollEmployees } from "@/components/Admin/Payroll/AdminPayrollEmployees";
import { redirect } from "next/navigation";

export default async function PayrollEmployeesPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (role === "employee") redirect(`/${role}/payroll/overview`);
  return <AdminPayrollEmployees />;
}
