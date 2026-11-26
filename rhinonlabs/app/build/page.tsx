import { Metadata } from "next";
import BuildPage from "@/components/Pages/Build/BuildPage";
import { getCaseStudies } from "@/lib/api";

export const metadata: Metadata = {
  title: "Have a Startup Idea? Let's Build It.",
  description:
    "Turn your startup idea into a launch-ready MVP without hiring a full tech team. Rhinon Labs helps founders plan, build, and launch fast.",
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
      "Turn your startup idea into a launch-ready MVP without hiring a full tech team. Rhinon Labs helps founders plan, build, and launch fast.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Have a Startup Idea? Let's Build It. | Rhinon Labs",
    description:
      "Turn your startup idea into a launch-ready MVP without hiring a full tech team. Rhinon Labs helps founders plan, build, and launch fast.",
  },
};

const page = async () => {
  const caseStudies = await getCaseStudies().catch(() => []);
  return <BuildPage caseStudies={caseStudies} />;
};

export default page;
