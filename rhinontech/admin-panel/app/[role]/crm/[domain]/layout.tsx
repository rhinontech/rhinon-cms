"use client";

import { CollapsibleSubNav } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { TbUsers, TbLayoutKanban, TbBuilding, TbChartBar, TbCurrencyRupee } from "react-icons/tb";
import { SiteScopeGuard } from "@/components/Admin/Common/Sites/SiteGate";
import { useCurrentSite, useModuleBase } from "@/lib/sites";

function CrmDomainNav({ children }: { children: React.ReactNode }) {
  const base = useModuleBase();
  const { site, sites } = useCurrentSite();

  // The brand's name replaces the module's when there is more than one to be
  // in — otherwise a single-site workspace would read "Main" instead of "CRM".
  const title = sites.length > 1 ? site?.name ?? "CRM" : "CRM";

  const items = [
    { label: "Leads", href: base, icon: <TbUsers size={18} />, exact: true },
    { label: "Accounts", href: `${base}/accounts`, icon: <TbBuilding size={18} /> },
    { label: "Pipeline", href: `${base}/pipeline`, icon: <TbLayoutKanban size={18} /> },
    { label: "Deals", href: `${base}/deals`, icon: <TbCurrencyRupee size={18} /> },
    { label: "Reports", href: `${base}/reports`, icon: <TbChartBar size={18} /> },
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
