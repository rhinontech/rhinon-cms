"use client";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { TeamSubNav } from "@/components/Admin/Common/TeamSubNav/TeamSubNav";
import { SideNavProvider } from "@/context/SideNavContext";

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardShell>
      <SideNavProvider>
        <div className="flex w-full h-full">
          <TeamSubNav />
          <main className="w-full h-full overflow-hidden">{children}</main>
        </div>
      </SideNavProvider>
    </AdminDashboardShell>
  );
}
