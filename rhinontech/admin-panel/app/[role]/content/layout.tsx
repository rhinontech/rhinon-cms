"use client";

import { CollapsibleSubNav } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { usePathname } from "next/navigation";
import { TbArticle, TbTrophy } from "react-icons/tb";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { SideNavProvider } from "@/context/SideNavContext";

function ContentLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const base = `/${roleSlug}/content`;

  const items = [
    { label: "Blogs", href: base, icon: <TbArticle size={18} />, exact: true },
    { label: "Case Studies", href: `${base}/case-studies`, icon: <TbTrophy size={18} /> },
  ];

  return (
    <div className="flex h-full w-full overflow-hidden">
      <CollapsibleSubNav title="Content" items={items} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardShell>
      <SideNavProvider>
        <ContentLayoutContent>{children}</ContentLayoutContent>
      </SideNavProvider>
    </AdminDashboardShell>
  );
}
