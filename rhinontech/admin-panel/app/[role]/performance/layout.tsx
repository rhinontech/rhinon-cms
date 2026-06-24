"use client";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { CollapsibleSubNav } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { SideNavProvider } from "@/context/SideNavContext";
import { usePathname } from "next/navigation";
import { TbChartBar, TbTarget, TbStar, TbUsers, TbRefresh } from "react-icons/tb";

function PerformanceLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const base = `/${roleSlug}/performance`;
  const isAdmin = roleSlug === "superadmin" || roleSlug === "hr";

  const items = [
    { label: "Overview", href: base, icon: <TbChartBar size={18} />, exact: true },
    { label: "My Goals", href: `${base}/goals`, icon: <TbTarget size={18} /> },
    { label: "My Reviews", href: `${base}/reviews`, icon: <TbStar size={18} /> },
    ...(isAdmin
      ? [
          { label: "Team", href: `${base}/team`, icon: <TbUsers size={18} /> },
          { label: "Cycles", href: `${base}/cycles`, icon: <TbRefresh size={18} /> },
        ]
      : []),
  ];

  return (
    <div className="flex w-full h-full">
      <CollapsibleSubNav title="Performance" items={items} />
      <main className="w-full h-full overflow-hidden">{children}</main>
    </div>
  );
}

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardShell>
      <SideNavProvider>
        <PerformanceLayoutContent>{children}</PerformanceLayoutContent>
      </SideNavProvider>
    </AdminDashboardShell>
  );
}
