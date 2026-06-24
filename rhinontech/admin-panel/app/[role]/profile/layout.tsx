"use client";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { CollapsibleSubNav } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { SideNavProvider } from "@/context/SideNavContext";
import { usePathname } from "next/navigation";
import { TbUser, TbLock } from "react-icons/tb";

function ProfileLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const base = `/${roleSlug}/profile`;

  const items = [
    { label: "Personal Info", href: `${base}/info`,     icon: <TbUser size={18} /> },
    { label: "Security",      href: `${base}/security`, icon: <TbLock size={18} /> },
  ];

  return (
    <div className="flex w-full h-full">
      <CollapsibleSubNav title="Profile" items={items} />
      <main className="w-full h-full overflow-hidden">{children}</main>
    </div>
  );
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardShell>
      <SideNavProvider>
        <ProfileLayoutContent>{children}</ProfileLayoutContent>
      </SideNavProvider>
    </AdminDashboardShell>
  );
}
