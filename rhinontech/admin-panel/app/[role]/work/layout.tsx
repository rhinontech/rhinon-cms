"use client";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { CollapsibleSubNav } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { SideNavProvider } from "@/context/SideNavContext";
import { usePathname } from "next/navigation";
import { TbCheckbox, TbFolders, TbGitCommit, TbLayoutDashboard, TbLayoutKanban, TbUsersGroup, TbList } from "react-icons/tb";
import { useOrganization } from "@/lib/useOrganization";

function WorkLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const base = `/${roleSlug}/work`;
  const { organization } = useOrganization();

  const items = [
    { label: "Overview", href: base, icon: <TbLayoutDashboard size={18} />, exact: true },
    // Projects opens straight into a workspace; the full list is its own entry.
    { label: "Projects", href: `${base}/projects`, icon: <TbFolders size={18} /> },
    { label: "All projects", href: `${base}/clients`, icon: <TbList size={18} /> },
    { label: "Tasks", href: `${base}/tasks`, icon: <TbCheckbox size={18} /> },
    { label: "Changes & Bugs", href: `${base}/changes`, icon: <TbLayoutKanban size={18} /> },
    { label: "Teams", href: `${base}/teams`, icon: <TbUsersGroup size={18} /> },
    // GitHub tracking is platform-only for now; the API enforces it too.
    ...(organization?.isPlatform ? [{ label: "Commits", href: `${base}/commits`, icon: <TbGitCommit size={18} /> }] : []),
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
