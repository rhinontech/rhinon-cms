"use client";

import { CollapsibleSubNav } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { TbBrush, TbForms, TbLayoutDashboard, TbMessages, TbSchool } from "react-icons/tb";
import { SiteScopeGuard } from "@/components/Admin/Common/Sites/SiteGate";
import { useCurrentSite, useModuleBase } from "@/lib/sites";

function ChatbotDomainNav({ children }: { children: React.ReactNode }) {
  const base = useModuleBase();
  const { site, sites } = useCurrentSite();
  const title = sites.length > 1 ? site?.name ?? "Chatbot" : "Chatbot";

  const items = [
    { label: "Overview", href: base, icon: <TbLayoutDashboard size={18} />, exact: true },
    { label: "Live chats", href: `${base}/chats`, icon: <TbMessages size={18} /> },
    { label: "Training", href: `${base}/training`, icon: <TbSchool size={18} /> },
    { label: "Appearance", href: `${base}/appearance`, icon: <TbBrush size={18} /> },
    { label: "Forms", href: `${base}/forms`, icon: <TbForms size={18} /> },
  ];

  return (
    <div className="flex h-full w-full overflow-hidden">
      <CollapsibleSubNav title={title} items={items} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

export default function ChatbotDomainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteScopeGuard>
      <ChatbotDomainNav>{children}</ChatbotDomainNav>
    </SiteScopeGuard>
  );
}
