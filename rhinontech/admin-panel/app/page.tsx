import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decodeToken } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("authToken")?.value;

  if (!authToken) redirect("/auth/login");

  const payload = decodeToken(authToken);

  if (!payload) redirect("/auth/login");

  redirect(`/${payload.roleSlug}/dashboard`);
}
