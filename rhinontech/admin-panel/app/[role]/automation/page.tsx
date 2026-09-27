"use client";

import { SitePickerGate } from "@/components/Admin/Common/Sites/SiteGate";

export default function AutomationPage() {
  return (
    <SitePickerGate
      title="Which brand's automations?"
      description="Workflows and their enrollments run per brand."
    />
  );
}
