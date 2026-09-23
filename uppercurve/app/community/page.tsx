import type { Metadata } from "next";
import CommunityPage from "@/components/Pages/Community/CommunityPage";

export const metadata: Metadata = {
  title: "UpperCurve Community — Free Tech & AI Community on WhatsApp & Discord",
  description:
    "Join 15,000+ developers, tech leads, and builders. Get daily high-signal AI updates, production starter kits, and exclusive invites to live weekend masterclasses.",
  openGraph: {
    title: "UpperCurve Community — Free Tech & AI Community on WhatsApp & Discord",
    description:
      "Join 15,000+ developers, tech leads, and builders. Get daily high-signal AI updates, production starter kits, and exclusive invites to live weekend masterclasses.",
    type: "website",
  },
};

export default function Page() {
  return <CommunityPage />;
}
