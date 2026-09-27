"use client";

import { SiteScopeGuard } from "@/components/Admin/Common/Sites/SiteGate";

export default function InboxDomainLayout({ children }: { children: React.ReactNode }) {
  return <SiteScopeGuard>{children}</SiteScopeGuard>;
}
