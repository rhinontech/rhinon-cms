"use client";

import { SitePickerGate } from "@/components/Admin/Common/Sites/SiteGate";

export default function CrmPage() {
  return (
    <SitePickerGate
      title="Which brand's pipeline?"
      description="Leads, accounts and deals are tracked separately per brand."
    />
  );
}
