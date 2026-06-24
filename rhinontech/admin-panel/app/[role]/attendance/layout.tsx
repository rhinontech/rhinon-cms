"use client";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { CollapsibleSubNav } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { SideNavProvider } from "@/context/SideNavContext";
import { usePathname } from "next/navigation";
import { TbCalendarStats, TbLayoutDashboard, TbTarget, TbUsers } from "react-icons/tb";

function AttendanceLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const base = `/${roleSlug}/attendance`;

  const items = [
    { label: "Overview", href: base, icon: <TbLayoutDashboard size={18} />, exact: true },
    ...(roleSlug === "superadmin"
      ? [
          { label: "Logs", href: `${base}/logs`, icon: <TbCalendarStats size={18} /> },
          { label: "Approvals", href: `${base}/approvals`, icon: <TbUsers size={18} /> },
        ]
      : []),
    { label: "Governance", href: `${base}/governance`, icon: <TbTarget size={18} /> },
  ];

  return (
    <div className="flex w-full h-full">
      <CollapsibleSubNav title="Attendance" items={items} />
      <main className="w-full h-full overflow-hidden">{children}</main>
    </div>
  );
}

export default function AttendanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardShell>
      <SideNavProvider>
        <AttendanceLayoutContent>{children}</AttendanceLayoutContent>
      </SideNavProvider>
    </AdminDashboardShell>
  );
}
