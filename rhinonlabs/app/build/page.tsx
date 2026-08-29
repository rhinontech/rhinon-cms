import { Metadata } from "next";
import BuildPage from "@/components/Pages/Build/BuildPage";

export const metadata: Metadata = {
  title: "Have a Startup Idea? Let's Build It.",
  description:
    "Turn your startup idea into a real, launch-ready product without hiring a full technology team. Rhinon Labs helps aspiring founders plan, design, build and launch their MVP.",
  keywords: [
    "startup idea to product",
    "MVP development",
    "build my startup",
    "technology partner for founders",
    "student startup development",
    "first-time founder MVP",
  ],
  alternates: {
    canonical: "https://rhinonlabs.com/build",
  },
  openGraph: {
    type: "website",
    url: "https://rhinonlabs.com/build",
    title: "Have a Startup Idea? Let's Build It. | Rhinon Labs",
    description:
      "You bring the business idea. We help you turn it into a working product — websites, apps, dashboards, AI features and the technology behind them.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Rhinon Labs — build your startup MVP" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Have a Startup Idea? Let's Build It. | Rhinon Labs",
    description:
      "Turn your startup idea into a real, launch-ready product without hiring a full technology team.",
    images: ["/og-image.jpg"],
  },
};

const page = () => {
  return <BuildPage />;
};

export default page;
