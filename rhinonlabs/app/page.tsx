import HomePage from "@/components/Pages/Home/HomePage"
import { Metadata } from "next";
import { FaqSchema, ServiceSchema } from "@/components/Common/SEO/PageSchemas";
import { getCaseStudies } from "@/lib/api";

export const metadata: Metadata = {
  title: { absolute: "AI Automation Agency for Startups & SMBs | Rhinon Labs" },
  description:
    "AI automation agency for startups and SMBs. We build custom AI agents, workflow automations, and internal tools in fixed-scope 2–4-week sprints.",
  // Exactly the URL Google indexes for the homepage (with the trailing slash), so
  // the declared and Google-selected canonicals can't disagree.
  alternates: { canonical: "https://www.rhinonlabs.com/" },
  openGraph: {
    type: "website",
    url: "https://www.rhinonlabs.com/",
    title: "AI Automation Agency for Startups & SMBs | Rhinon Labs",
    description:
      "AI automation agency for startups and SMBs. We build custom AI agents, workflow automations, and internal tools in fixed-scope 2–4-week sprints.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Rhinon Labs — AI Automation Agency for Startups & SMBs" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Automation Agency for Startups & SMBs | Rhinon Labs",
    description:
      "AI automation agency for startups and SMBs. We build custom AI agents, workflow automations, and internal tools in fixed-scope 2–4-week sprints.",
    images: ["/og-image.jpg"],
  },
};

const page = async () => {
  const caseStudies = await getCaseStudies().catch(() => []);
  return (
    <>
      {/* Preload matching hero background image so mobile LCP is discovered immediately */}
      <link rel="preload" as="image" type="image/avif" href="/images/background/background-960.avif" media="(max-width: 767px)" fetchPriority="high" />
      <link rel="preload" as="image" type="image/avif" href="/images/background/background-1920.avif" media="(min-width: 768px)" fetchPriority="high" />
      <ServiceSchema />
      <FaqSchema />
      <HomePage caseStudies={caseStudies} />
    </>
  );
};

export default page
