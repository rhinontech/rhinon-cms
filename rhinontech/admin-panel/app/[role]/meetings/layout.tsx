"use client";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";

export default function MeetingsLayout({ children }: { children: React.ReactNode }) {
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
