"use client";

import { SitePickerGate } from "@/components/Admin/Common/Sites/SiteGate";

export default function ChatbotPage() {
  return (
    <SitePickerGate
      title="Which brand's chatbot?"
      description="Each brand has its own website chatbot, training and live chats."
    />
  );
}
