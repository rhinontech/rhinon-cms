"use client";

import { CollapsibleSubNav } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { usePathname } from "next/navigation";
import { TbUsers, TbLayoutKanban } from "react-icons/tb";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { SideNavProvider } from "@/context/SideNavContext";

function CrmLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const base = `/${roleSlug}/crm`;

  const items = [
    { label: "Leads", href: base, icon: <TbUsers size={18} />, exact: true },
    { label: "Pipeline", href: `${base}/pipeline`, icon: <TbLayoutKanban size={18} /> },
  ];

  return (
    <div className="flex h-full w-full overflow-hidden">
      <CollapsibleSubNav title="CRM" items={items} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardShell>
      <SideNavProvider>
        <CrmLayoutContent>{children}</CrmLayoutContent>
      </SideNavProvider>
    </AdminDashboardShell>
  );
}
