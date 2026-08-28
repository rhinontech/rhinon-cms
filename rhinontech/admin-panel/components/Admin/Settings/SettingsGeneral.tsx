"use client";

import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { CompanySignature } from "@/components/Admin/Settings/CompanySignature";

export function SettingsGeneral() {
  return (
    <div className="flex flex-col h-full glass-panel rounded-r-xl overflow-hidden">
      <div className="sticky top-0 z-10 flex items-center gap-4 h-16 px-5 border-b border-border glass-header">
        <SubNavToggle />
        <div>
          <h1 className="text-base font-semibold tracking-tight">General</h1>
          <p className="text-xs text-muted-foreground">Company branding used across letters and documents</p>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <CompanySignature />
      </div>
    </div>
  );
}
