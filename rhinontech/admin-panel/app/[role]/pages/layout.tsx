"use client";

import { usePathname } from "next/navigation";
import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { SideNavProvider } from "@/context/SideNavContext";
import { PagesSidebar } from "@/components/Admin/Pages/PagesSidebar";

function PagesLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split("/");
  // /{role}/pages/{id} → last segment is the active page id; /{role}/pages has none.
  const activeId = segments[3] && segments[2] === "pages" ? segments[3] : undefined;

  return (
    <div className="flex h-full w-full overflow-hidden">
      <PagesSidebar activeId={activeId} />
      <main className="w-full h-full overflow-hidden">{children}</main>
    </div>
  );
}

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardShell>
      <SideNavProvider>
        <PagesLayoutContent>{children}</PagesLayoutContent>
      </SideNavProvider>
    </AdminDashboardShell>
  );
}
