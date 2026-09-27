import type React from "react";
import { SiteHeader } from "@/components/Admin/Common/SiteHeader/SiteHeader";
import { Sidebar } from "@/components/Admin/Common/Sidebar/Sidebar";
import { ConfirmDialogProvider } from "@/components/Admin/Common/ConfirmDialog";
import { PermissionsProvider } from "@/context/PermissionsContext";

export function AdminDashboardShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <PermissionsProvider>
      <ConfirmDialogProvider>
        <div className="flex h-screen w-full overflow-hidden app-backdrop">
          <Sidebar />
          <main className="flex min-h-0 min-w-0 flex-col m-2 gap-2 w-full">
            <SiteHeader />
            {/* Rounded here, not per page, so whatever a page's edge is — a collapsed
                sub-nav, a sticky header — the content panel keeps its corners. */}
            <div className={`min-h-0 flex-1 overflow-hidden rounded-xl ${className ?? ""}`}>{children}</div>
          </main>
        </div>
      </ConfirmDialogProvider>
    </PermissionsProvider>
  );
}
