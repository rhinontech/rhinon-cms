"use client";

import { CollapsibleSubNav } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { TbGitBranch, TbUserCheck, TbSettings } from "react-icons/tb";
import { SiteScopeGuard } from "@/components/Admin/Common/Sites/SiteGate";
import { useCurrentSite, useModuleBase } from "@/lib/sites";

function AutomationDomainNav({ children }: { children: React.ReactNode }) {
  const base = useModuleBase();
  const { site, sites } = useCurrentSite();
  const title = sites.length > 1 ? site?.name ?? "Automation" : "Automation";

  const items = [
    { label: "Workflows", href: `${base}/workflows`, icon: <TbGitBranch size={18} /> },
    { label: "Enrollments", href: `${base}/enrollments`, icon: <TbUserCheck size={18} /> },
    { label: "Settings", href: `${base}/settings`, icon: <TbSettings size={18} /> },
  ];

  return (
    <div className="flex h-full w-full overflow-hidden">
      <CollapsibleSubNav title={title} items={items} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

export default function AutomationDomainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteScopeGuard>
      <AutomationDomainNav>{children}</AutomationDomainNav>
    </SiteScopeGuard>
  );
}
