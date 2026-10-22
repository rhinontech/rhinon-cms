"use client";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { SideNavProvider } from "@/context/SideNavContext";
import { CallProvider } from "@/components/Admin/Chatbot/CallContext";
import { GlobalCallWidget } from "@/components/Admin/Chatbot/GlobalCallWidget";

export default function ChatbotLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardShell>
      <SideNavProvider>
        <CallProvider>
          {children}
          <GlobalCallWidget />
        </CallProvider>
      </SideNavProvider>
    </AdminDashboardShell>
  );
}
