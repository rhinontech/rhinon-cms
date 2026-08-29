import { redirect } from "next/navigation";

// /startup is an alias used in outreach copy — /build is the canonical campaign page.
export default function StartupPage() {
  redirect("/build");
}
