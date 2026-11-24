"use client";

import { usePathname } from "next/navigation";
import {
  TbBrandLinkedin, TbGitBranch, TbHierarchy, TbLayoutDashboard, TbSettings, TbTarget, TbUserCheck, TbUsersGroup,
} from "react-icons/tb";
import { CollapsibleSubNav, type SubNavItem } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { siteSlugFromPath, useCurrentSite } from "@/lib/sites";

/**
 * Outreach's menu, shared by its own pages and by Sequences.
 *
 * Sequences (the automation workflows) used to be a separate sidebar module
 * called Automation, though every one of them is an outreach sequence: send,
 * wait, branch on an open, follow up. It now sits here; its URLs are unchanged.
 * "Contacts" became "Lists", which is what the page holds.
 */
export function OutreachSubNav() {
  const pathname = usePathname();
  const role = pathname.split("/")[1];
  const brand = siteSlugFromPath(pathname);
  const outreach = `/${role}/outreach/${brand}`;
  const sequences = `/${role}/automation/${brand}`;
  const { site, sites } = useCurrentSite();
  const title = sites.length > 1 ? site?.name ?? "Outreach" : "Outreach";

  const items: SubNavItem[] = [
    { label: "Overview", href: outreach, icon: <TbLayoutDashboard size={18} />, exact: true },
    { label: "Campaigns", href: `${outreach}/campaigns`, icon: <TbTarget size={18} /> },
    {
      label: "Sequences",
      href: `${sequences}/workflows`,
      icon: <TbHierarchy size={18} />,
      isCollapsible: true,
      isExpanded: pathname.startsWith(sequences),
      children: [
        { label: "Workflows", href: `${sequences}/workflows`, icon: <TbGitBranch size={16} />, exact: false },
        { label: "Enrollments", href: `${sequences}/enrollments`, icon: <TbUserCheck size={16} />, exact: false },
        { label: "Settings", href: `${sequences}/settings`, icon: <TbSettings size={16} />, exact: false },
      ],
    },
    { label: "Lists", href: `${outreach}/contacts`, icon: <TbUsersGroup size={18} /> },
    { label: "LinkedIn", href: `${outreach}/publishing`, icon: <TbBrandLinkedin size={18} /> },
    // Hidden — nobody uses these. The pages and their routes still exist, so
    // adding them here brings them straight back:
    // { label: "Manual send", href: `${outreach}/manual`, icon: <TbMailOpened size={18} /> },
    // { label: "Templates", href: `${outreach}/templates`, icon: <TbTemplate size={18} /> },
  ];

  return <CollapsibleSubNav title={title} items={items} />;
}
