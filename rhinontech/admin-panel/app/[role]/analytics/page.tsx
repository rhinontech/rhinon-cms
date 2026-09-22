"use client";

import { SitePickerGate } from "@/components/Admin/Common/Sites/SiteGate";

export default function AnalyticsPage() {
  return (
    <SitePickerGate
      title="Which brand's traffic?"
      description="Each brand's site reports its own visitors, sources and pages."
    />
  );
}
