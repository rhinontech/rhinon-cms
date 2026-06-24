"use client";
import { DashboardProvider } from "@/components/Common/DashboardProvider/DashboardProvider";
import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { SideNavProvider } from "@/context/SideNavContext";

export default function EngageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main
      className="flex min-h-screen w-full flex-col"
      style={{
        minWidth: "1440px",
        overflowX: "auto",
      }}
    >
      <DashboardProvider>
        <SideNavProvider>
          <AdminDashboardShell>
            {children}
          </AdminDashboardShell>
        </SideNavProvider>
      </DashboardProvider>
    </main>
  );
}
