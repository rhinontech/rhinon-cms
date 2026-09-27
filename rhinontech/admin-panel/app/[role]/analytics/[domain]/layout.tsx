"use client";

import { SiteScopeGuard } from "@/components/Admin/Common/Sites/SiteGate";

export default function AnalyticsDomainLayout({ children }: { children: React.ReactNode }) {
  return <SiteScopeGuard>{children}</SiteScopeGuard>;
}
