"use client";

import { SiteScopeGuard } from "@/components/Admin/Common/Sites/SiteGate";
import { OutreachSubNav } from "@/components/Admin/Outreach/OutreachSubNav";

/**
 * Sequences live inside Outreach now, so these pages show Outreach's menu
 * (with Sequences open) instead of a separate "Automation" one.
 */
export default function AutomationDomainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteScopeGuard>
      <div className="flex h-full w-full overflow-hidden">
        <OutreachSubNav />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </SiteScopeGuard>
  );
}
