"use client";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";

export default function StartupIdeasLayout({ children }: { children: React.ReactNode }) {
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
