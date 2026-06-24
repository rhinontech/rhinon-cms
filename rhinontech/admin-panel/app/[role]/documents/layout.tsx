"use client";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { CollapsibleSubNav } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { SideNavProvider } from "@/context/SideNavContext";
import { usePathname } from "next/navigation";
import { TbFileAlert, TbFiles, TbFolders } from "react-icons/tb";

function DocumentsLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const base = `/${roleSlug}/documents`;
  const isAdmin = roleSlug === "superadmin" || roleSlug === "hr";

  const items = [
    { label: "My Documents", href: base, icon: <TbFiles size={18} />, exact: true },
    ...(isAdmin
      ? [
          { label: "All Documents", href: `${base}/all`, icon: <TbFolders size={18} /> },
          { label: "Requests", href: `${base}/requests`, icon: <TbFileAlert size={18} /> },
        ]
      : []),
  ];

  return (
    <div className="flex w-full h-full">
      <CollapsibleSubNav title="Documents" items={items} />
      <main className="w-full h-full overflow-hidden">{children}</main>
    </div>
  );
}

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardShell>
      <SideNavProvider>
        <DocumentsLayoutContent>{children}</DocumentsLayoutContent>
      </SideNavProvider>
    </AdminDashboardShell>
  );
}
