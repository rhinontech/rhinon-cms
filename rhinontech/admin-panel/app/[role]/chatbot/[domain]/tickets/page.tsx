"use client";

import { Suspense } from "react";
import { ChatbotTickets } from "@/components/Admin/Chatbot/ChatbotTickets";

export default function ChatbotTicketsPage() {
  return (
    <Suspense>
      <ChatbotTickets />
    </Suspense>
  );
}
