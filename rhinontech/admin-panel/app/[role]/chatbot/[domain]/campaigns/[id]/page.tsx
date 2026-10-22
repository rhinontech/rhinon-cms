"use client";

import { useParams } from "next/navigation";
import { ChatbotCampaignEditor } from "@/components/Admin/Chatbot/ChatbotCampaignEditor";

export default function ChatbotCampaignEditorPage() {
  const { id } = useParams<{ id: string }>();
  return <ChatbotCampaignEditor id={id} />;
}
