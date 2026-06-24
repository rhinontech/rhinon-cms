"use client";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { AnalyticsDashboard } from "@/components/Admin/Analytics/AnalyticsDashboard";

export default function AnalyticsPage() {
  return (
    <AdminDashboardShell>
      <AnalyticsDashboard />
    </AdminDashboardShell>
  );
}
