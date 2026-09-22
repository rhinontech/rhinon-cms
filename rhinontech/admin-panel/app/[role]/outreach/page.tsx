"use client";

import { SitePickerGate } from "@/components/Admin/Common/Sites/SiteGate";

export default function OutreachPage() {
  return (
    <SitePickerGate
      title="Which brand are you sending as?"
      description="Campaigns, contacts and LinkedIn publishing are kept separate per brand."
    />
  );
}
