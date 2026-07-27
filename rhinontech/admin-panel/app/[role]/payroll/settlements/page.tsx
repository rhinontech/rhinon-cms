import { FinalSettlements } from "@/components/Admin/Payroll/FinalSettlements";
import { redirect } from "next/navigation";

export default async function SettlementsPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (role === "employee") redirect(`/${role}/payroll/overview`);
  return <FinalSettlements />;
}
