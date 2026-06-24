import { redirect } from "next/navigation";

// /[role]/work/projects redirects to /[role]/work/clients (same content)
export default function WorkProjectsRedirect() {
  redirect("../clients");
}
