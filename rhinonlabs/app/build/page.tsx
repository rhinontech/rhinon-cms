import { Metadata } from "next";
import BuildPage from "@/components/Pages/Build/BuildPage";

export const metadata: Metadata = {
  title: "Have a Startup Idea? Let's Build It.",
  description:
    "Turn your startup idea into a real, launch-ready product without hiring a full technology team. Rhinon Labs helps aspiring founders plan, design, build and launch their MVP.",
  // keywords: [
  //   "startup idea to product",
  //   "MVP development",
  //   "build my startup",
  //   "technology partner for founders",
  //   "student startup development",
  //   "first-time founder MVP",
  // ],
  alternates: {
    canonical: "https://www.rhinonlabs.com/build",
  },
  openGraph: {
    type: "website",
    url: "https://www.rhinonlabs.com/build",
    title: "Have a Startup Idea? Let's Build It. | Rhinon Labs",
    description:
      "Turn your startup idea into a real, launch-ready product without hiring a full technology team. Rhinon Labs helps aspiring founders plan, design, build and launch their MVP.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Have a Startup Idea? Let's Build It. | Rhinon Labs",
    description:
      "Turn your startup idea into a real, launch-ready product without hiring a full technology team. Rhinon Labs helps aspiring founders plan, design, build and launch their MVP.",
  },
};

const page = () => {
  return <BuildPage />;
};

export default page;
