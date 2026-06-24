import type React from "react";
import { SiteHeader } from "@/components/Admin/Common/SiteHeader/SiteHeader";
import { Sidebar } from "@/components/Admin/Common/Sidebar/Sidebar";

export function AdminDashboardShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-stone-200">
      <Sidebar />
      <main className="flex min-h-0 min-w-0 flex-col m-2 gap-2 w-full">
        <SiteHeader />
        <div className={`min-h-0 flex-1 overflow-hidden ${className ?? ""}`}>{children}</div>
      </main>
    </div>
  );
}
