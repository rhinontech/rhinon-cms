"use client";

import { SitePickerGate } from "@/components/Admin/Common/Sites/SiteGate";

export default function InboxPage() {
  return (
    <SitePickerGate
      title="Which brand's inbox?"
      description="Mail is kept separate per brand, so a reply lands where the conversation started."
    />
  );
}
