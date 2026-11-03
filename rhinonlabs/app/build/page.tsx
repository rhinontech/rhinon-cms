import { Metadata } from "next";
import BuildPage from "@/components/Pages/Build/BuildPage";

export const metadata: Metadata = {
  title: "Have a Startup Idea? Let's Build It.",
  description:
    "Turn your startup idea into a launch-ready product without hiring a tech team. Rhinon Labs designs, builds, and launches your MVP fast.",
  keywords: [
    "startup idea to product",
    "MVP development",
    "build my startup",
    "technology partner for founders",
    "student startup development",
    "first-time founder MVP",
  ],
  alternates: {
    canonical: "https://www.rhinonlabs.com/build",
  },
  openGraph: {
    type: "website",
    url: "https://www.rhinonlabs.com/build",
    title: "Have a Startup Idea? Let's Build It. | Rhinon Labs",
    description:
      "Turn your startup idea into a launch-ready product without hiring a tech team. Rhinon Labs designs, builds, and launches your MVP fast.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Rhinon Labs — build your startup MVP" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Have a Startup Idea? Let's Build It. | Rhinon Labs",
    description:
      "Turn your startup idea into a launch-ready product without hiring a tech team. Rhinon Labs designs, builds, and launches your MVP fast.",
    images: ["/og-image.jpg"],
  },
};

const page = () => {
  return <BuildPage />;
};

export default page;
