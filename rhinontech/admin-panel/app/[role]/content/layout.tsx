"use client";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { ContentSubNav } from "@/components/Admin/Common/ContentSubNav/ContentSubNav";
import { SideNavProvider } from "@/context/SideNavContext";

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardShell>
      <SideNavProvider>
        <div className="flex h-full w-full overflow-hidden">
          <ContentSubNav />
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </SideNavProvider>
    </AdminDashboardShell>
  );
}
