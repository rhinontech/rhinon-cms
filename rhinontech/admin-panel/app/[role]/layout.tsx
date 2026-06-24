import type { Metadata } from "next";
import { DashboardProvider } from "@/components/Common/DashboardProvider/DashboardProvider";

export const metadata: Metadata = {
  title: "Rhinon Tech",
};

export default function RoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="flex min-h-screen w-full flex-col"
      style={{ minWidth: "1440px", overflowX: "auto" }}
    >
      <DashboardProvider>{children}</DashboardProvider>
    </main>
  );
}
