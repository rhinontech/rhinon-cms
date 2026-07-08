"use client";

import { AdminPayrollOverview } from "@/components/Admin/Payroll/AdminPayrollOverview";
import { PayrollOverview } from "@/components/Admin/Payroll/PayrollOverview";
import { usePermissions } from "@/context/PermissionsContext";

export default function OverviewPage() {
  const { has } = usePermissions();
  return has("payroll:write") ? <AdminPayrollOverview /> : <PayrollOverview />;
}
