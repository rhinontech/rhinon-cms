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

  // Keyed on BOTH signals on purpose. `userType` is a new JWT claim, so a token
  // issued before it shipped carries only `roleSlug` — and relying on the new
  // claim alone left those sessions sitting on the internal dashboard, which is
  // exactly what happened in production.
  const isCollaborator = payload?.userType === "guest" || payload?.roleSlug === "collaborator";
  if (isCollaborator) redirect("/portal");

  return (
    <main className="flex min-h-screen w-full flex-col">
      <DashboardProvider>{children}</DashboardProvider>
    </main>
  );
}
