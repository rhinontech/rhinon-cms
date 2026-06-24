import { PayslipDetail } from "@/components/Admin/Payroll/PayslipDetail";

export default async function PayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PayslipDetail id={id} />;
}
