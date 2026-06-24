"use client";

import { CollapsibleSubNav } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { usePathname } from "next/navigation";
import { TbUsers, TbTarget, TbTemplate, TbMailOpened, TbLayoutDashboard } from "react-icons/tb";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { SideNavProvider } from "@/context/SideNavContext";

function OutreachLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const base = `/${roleSlug}/outreach`;

  const items = [
    { label: "Overview", href: base, icon: <TbLayoutDashboard size={18} />, exact: true },
    { label: "Leads", href: `${base}/leads`, icon: <TbUsers size={18} /> },
    { label: "Campaigns", href: `${base}/campaigns`, icon: <TbTarget size={18} /> },
    { label: "Manual Send", href: `${base}/manual`, icon: <TbMailOpened size={18} /> },
    { label: "Templates", href: `${base}/templates`, icon: <TbTemplate size={18} /> },
  ];

  return (
    <div className="flex h-full w-full overflow-hidden">
      <CollapsibleSubNav title="Outreach" items={items} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

export default function OutreachLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardShell>
      <SideNavProvider>
        <OutreachLayoutContent>{children}</OutreachLayoutContent>
      </SideNavProvider>
    </AdminDashboardShell>
  );
}
