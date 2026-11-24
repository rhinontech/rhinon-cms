"use client";

import { SiteScopeGuard } from "@/components/Admin/Common/Sites/SiteGate";
import { OutreachSubNav } from "@/components/Admin/Outreach/OutreachSubNav";

export default function OutreachDomainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteScopeGuard>
      <div className="flex h-full w-full overflow-hidden">
        <OutreachSubNav />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </SiteScopeGuard>
  );
}
