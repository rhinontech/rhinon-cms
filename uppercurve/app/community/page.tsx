import type { Metadata } from "next";
import CommunityPage from "@/components/Pages/Community/CommunityPage";

export const metadata: Metadata = {
  title: "Free AI Community on WhatsApp | UpperCurve Community",
  description:
    "Join UpperCurve’s Free AI Community on WhatsApp. Get curated AI Updates, Tools and Templates, and early invites to live workshops and masterclasses.",
  alternates: {
    canonical: "/community",
  },
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
