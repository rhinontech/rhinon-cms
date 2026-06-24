"use client";

import { usePathname } from "next/navigation";
import { AdminPayrollOverview } from "@/components/Admin/Payroll/AdminPayrollOverview";
import { PayrollOverview } from "@/components/Admin/Payroll/PayrollOverview";

export default function OverviewPage() {
  const roleSlug = usePathname().split("/")[1];
  const isAdminView = roleSlug === "superadmin" || roleSlug === "hr";
  return isAdminView ? <AdminPayrollOverview /> : <PayrollOverview />;
}
