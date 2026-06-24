"use client";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { CollapsibleSubNav } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { SideNavProvider } from "@/context/SideNavContext";
import { usePathname } from "next/navigation";
import { TbCheckbox, TbFolders, TbLayoutDashboard, TbLayoutKanban, TbUsers, TbWorld, TbCalendarStats } from "react-icons/tb";

function WorkLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const base = `/${roleSlug}/work`;

  const items = [
    { label: "Overview", href: base, icon: <TbLayoutDashboard size={18} />, exact: true },
    { label: "Clients / Projects", href: `${base}/clients`, icon: <TbFolders size={18} /> },
    { label: "My tasks", href: `${base}/my`, icon: <TbCheckbox size={18} /> },
    { label: "Team tasks", href: `${base}/team`, icon: <TbUsers size={18} /> },
    { label: "All tasks", href: `${base}/all`, icon: <TbWorld size={18} /> },
    { label: "Changes & Bugs", href: `${base}/changes`, icon: <TbLayoutKanban size={18} /> },
  ];

  return (
    <div className="flex w-full h-full">
      <CollapsibleSubNav title="Work" items={items} />
      <main className="w-full h-full overflow-hidden">{children}</main>
    </div>
  );
}

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardShell>
      <SideNavProvider>
        <WorkLayoutContent>{children}</WorkLayoutContent>
      </SideNavProvider>
    </AdminDashboardShell>
  );
}
