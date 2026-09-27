"use client";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { SideNavProvider } from "@/context/SideNavContext";

export default function OutreachLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardShell>
      <SideNavProvider>{children}</SideNavProvider>
    </AdminDashboardShell>
  );
}
