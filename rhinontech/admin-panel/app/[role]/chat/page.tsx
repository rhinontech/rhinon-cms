import { Suspense } from "react";
import { ChatPage } from "@/components/Admin/Chat/ChatPage";

export default function ChatRoutePage() {
  // ChatPage reads the open chat/thread from the query string.
  return (
    <Suspense>
      <ChatPage />
    </Suspense>
  );
}
