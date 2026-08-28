import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardProvider } from "@/components/Common/DashboardProvider/DashboardProvider";
import { decodeToken } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Rhinon Tech",
};

/**
 * External collaborators must never reach the internal shell.
 *
 * The login redirect alone was not enough: it only decides at the moment of
 * sign-in, so a bookmark, a direct URL or a session that outlived a deploy
 * still landed a guest on the HR dashboard. Every /[role]/* route is now
 * checked, which mirrors how the API gates guests in the auth middleware
 * rather than at any single entry point.
 */
export default async function RoleLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get("authToken")?.value;
  const payload = token ? decodeToken(token) : null;

  if (payload?.userType === "guest") redirect("/portal");

  return (
    <main className="flex min-h-screen w-full flex-col">
      <DashboardProvider>{children}</DashboardProvider>
    </main>
  );
}
