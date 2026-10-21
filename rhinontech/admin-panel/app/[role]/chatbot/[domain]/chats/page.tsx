"use client";

import { Suspense } from "react";
import { ChatbotChats } from "@/components/Admin/Chatbot/ChatbotChats";

export default function ChatbotChatsPage() {
  return (
    <Suspense>
      <ChatbotChats />
    </Suspense>
  );
}
