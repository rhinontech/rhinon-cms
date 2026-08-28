import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decodeToken } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("authToken")?.value;

  if (!authToken) redirect("/auth/login");

  const payload = decodeToken(authToken);

  if (!payload) redirect("/auth/login");

  // The internal dashboard 403s for guests, so send them to their own workspace.
  if (payload.userType === "guest" || payload.roleSlug === "collaborator") redirect("/portal");

  redirect(`/${payload.roleSlug}/dashboard`); 
}
