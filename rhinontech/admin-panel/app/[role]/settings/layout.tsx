"use client";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { SettingsSubNav } from "@/components/Admin/Common/SettingsSubNav/SettingsSubNav";
import { SideNavProvider } from "@/context/SideNavContext";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardShell>
      <SideNavProvider>
        <div className="flex w-full h-full">
          <SettingsSubNav />
          <main className="w-full h-full overflow-hidden">{children}</main>
        </div>
      </SideNavProvider>
    </AdminDashboardShell>
  );
}
