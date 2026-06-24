"use client";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { CollapsibleSubNav } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { SideNavProvider } from "@/context/SideNavContext";
import { usePathname } from "next/navigation";
import { TbCalendarOff, TbCalendarEvent, TbCalendarStats, TbCheck, TbTarget } from "react-icons/tb";

function LeaveLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const base = `/${roleSlug}/leave`;
  const isAdmin = roleSlug === "superadmin" || roleSlug === "hr";

  const items = isAdmin
    ? [
        { label: "Overview",      href: base,                  icon: <TbCalendarOff   size={18} />, exact: true },
        { label: "All Requests",  href: `${base}/requests`,    icon: <TbCalendarEvent size={18} /> },
        { label: "Team Calendar", href: `${base}/calendar`,    icon: <TbCalendarStats size={18} /> },
        { label: "Approvals",     href: `${base}/approvals`,   icon: <TbCheck         size={18} /> },
        { label: "Policies",      href: `${base}/policies`,    icon: <TbTarget        size={18} /> },
      ]
    : [
        { label: "Overview",  href: base,               icon: <TbCalendarOff   size={18} />, exact: true },
        { label: "My Leaves", href: `${base}/requests`, icon: <TbCalendarEvent size={18} /> },
      ];

  return (
    <div className="flex w-full h-full">
      <CollapsibleSubNav title="Leave" items={items} />
      <main className="w-full h-full overflow-hidden">{children}</main>
    </div>
  );
}

export default function LeaveLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardShell>
      <SideNavProvider>
        <LeaveLayoutContent>{children}</LeaveLayoutContent>
      </SideNavProvider>
    </AdminDashboardShell>
  );
}
