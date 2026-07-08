"use client";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { CollapsibleSubNav } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { SideNavProvider } from "@/context/SideNavContext";
import { usePermissions } from "@/context/PermissionsContext";
import { usePathname } from "next/navigation";
import { TbSettings, TbShieldLock, TbBooks } from "react-icons/tb";

function SettingsLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const base = `/${roleSlug}/settings`;
  const { has } = usePermissions();

  const items = [
    { label: "General", href: base, icon: <TbSettings size={18} />, exact: true },
    ...(has("settings:write")
      ? [
          { label: "Roles & Permissions", href: `${base}/roles`, icon: <TbShieldLock size={18} /> },
          { label: "Governance", href: `${base}/governance`, icon: <TbBooks size={18} /> },
        ]
      : []),
  ];

  return (
    <div className="flex w-full h-full">
      <CollapsibleSubNav title="Settings" items={items} />
      <main className="w-full h-full overflow-hidden">{children}</main>
    </div>
  );
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardShell>
      <SideNavProvider>
        <SettingsLayoutContent>{children}</SettingsLayoutContent>
      </SideNavProvider>
    </AdminDashboardShell>
  );
}
