"use client";

import { CollapsibleSubNav } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { usePathname } from "next/navigation";
import { TbGitBranch, TbUserCheck, TbSettings } from "react-icons/tb";
import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { SideNavProvider } from "@/context/SideNavContext";

function AutomationLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1] || "admin";
  const base = `/${roleSlug}/automation`;

  const items = [
    { label: "Workflows", href: `${base}/workflows`, icon: <TbGitBranch size={18} /> },
    { label: "Enrollments", href: `${base}/enrollments`, icon: <TbUserCheck size={18} /> },
    { label: "Settings", href: `${base}/settings`, icon: <TbSettings size={18} /> },
  ];

  return (
    <div className="flex h-full w-full overflow-hidden">
      <CollapsibleSubNav title="Automation" items={items} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

export default function AutomationLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardShell>
      <SideNavProvider>
        <AutomationLayoutContent>{children}</AutomationLayoutContent>
      </SideNavProvider>
    </AdminDashboardShell>
  );
}
