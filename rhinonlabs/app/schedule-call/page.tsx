import { Metadata } from "next";
import SchedulerCore from "@/components/Common/CTA/SchedulerCore";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rhinonlabs.com";

export const metadata: Metadata = {
  title: "Schedule a Call | Rhinon Labs",
  description:
    "Pick a time to see Rhinon Labs in action — a 30 minute discovery call over Google Meet to scope your MVP or AI build.",
  alternates: {
    canonical: `${SITE_URL}/schedule-call`,
  },
  openGraph: {
    title: "Schedule a Discovery Call | Rhinon Labs",
    description:
      "Book a 30-minute discovery call with Rhinon Labs to discuss your project requirements and technical scope.",
    url: `${SITE_URL}/schedule-call`,
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Schedule a Call with Rhinon Labs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Schedule a Discovery Call | Rhinon Labs",
    description:
      "Book a 30-minute discovery call with Rhinon Labs to discuss your project requirements and technical scope.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

export default function ScheduleCallPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0B0F19]">
      <SchedulerCore />
    </main>
  );
}
