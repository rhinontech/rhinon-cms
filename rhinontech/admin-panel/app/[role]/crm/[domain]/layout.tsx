"use client";

import { CollapsibleSubNav } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { TbUsers, TbLayoutKanban, TbBuilding, TbChartBar, TbCurrencyRupee, TbUserSearch } from "react-icons/tb";
import { usePermissions } from "@/context/PermissionsContext";
import { SiteScopeGuard } from "@/components/Admin/Common/Sites/SiteGate";
import { useModuleBase } from "@/lib/sites";

function CrmDomainNav({ children }: { children: React.ReactNode }) {
  const base = useModuleBase();
  // Lead sourcing is platform-only (the backend refuses other workspaces too).
  const { account } = usePermissions();
  const isPlatform = Boolean(account?.organization?.isPlatform);

  // One CRM for every brand, so it is always just "CRM" (it used to take the brand's name).
  const title = "CRM";

  const items = [
    { label: "Leads", href: base, icon: <TbUsers size={18} />, exact: true },
    { label: "Accounts", href: `${base}/accounts`, icon: <TbBuilding size={18} /> },
    { label: "Pipeline", href: `${base}/pipeline`, icon: <TbLayoutKanban size={18} /> },
    { label: "Deals", href: `${base}/deals`, icon: <TbCurrencyRupee size={18} /> },
    { label: "Reports", href: `${base}/reports`, icon: <TbChartBar size={18} /> },
    ...(isPlatform ? [{ label: "Lead Finder", href: `${base}/finder`, icon: <TbUserSearch size={18} /> }] : []),
  ];

  return (
    <div className="flex h-full w-full overflow-hidden">
      <CollapsibleSubNav title={title} items={items} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

export default function CrmDomainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteScopeGuard>
      <CrmDomainNav>{children}</CrmDomainNav>
    </SiteScopeGuard>
  );
}
