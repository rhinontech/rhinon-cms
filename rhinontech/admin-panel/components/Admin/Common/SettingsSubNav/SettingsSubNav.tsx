"use client";

import { usePathname } from "next/navigation";
import { TbSettings, TbShieldLock, TbBooks, TbBook, TbFileText, TbCalendarEvent, TbRocket } from "react-icons/tb";
import { MdOutlineCloud } from "react-icons/md";
import { CollapsibleSubNav, type SubNavItem } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { usePermissions } from "@/context/PermissionsContext";

/** Shared sub-nav for Settings, which absorbs Docs Access and Provisioning. */
export function SettingsSubNav() {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const base = `/${roleSlug}/settings`;
  const { has } = usePermissions();

  const items: SubNavItem[] = [
    { label: "General", href: base, icon: <TbSettings size={18} />, exact: true },
    ...(has("settings:write")
      ? [
          { label: "Roles & Permissions", href: `${base}/roles`, icon: <TbShieldLock size={18} /> },
          { label: "Access Governance", href: `${base}/governance`, icon: <TbBooks size={18} /> },
          { label: "Google Calendar", href: `${base}/google-calendar`, icon: <TbCalendarEvent size={18} /> },
        ]
      : []),
    ...(has("deploy:read")
      ? [{ label: "Deploy", href: `${base}/deploy`, icon: <TbRocket size={18} /> }]
      : []),
    ...(has("employees:write")
      ? [{ label: "Letter Templates", href: `${base}/letter-templates`, icon: <TbFileText size={18} /> }]
      : []),
    ...(has("docsAccess:read")
      ? [{ label: "Docs Access", href: `/${roleSlug}/docs-access`, icon: <TbBook size={18} /> }]
      : []),
    ...(has("provisioning:read")
      ? [{ label: "Provisioning", href: `/${roleSlug}/provisioning`, icon: <MdOutlineCloud size={18} /> }]
      : []),
  ];

  return <CollapsibleSubNav title="Settings" items={items} />;
}
