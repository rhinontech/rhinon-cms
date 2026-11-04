import CaseStudiesIndex from "@/components/Pages/CaseStudies/CaseStudiesIndex";
import { getCaseStudies } from "@/lib/api";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.rhinonlabs.com";

export const metadata: Metadata = {
  title: "Case Studies — Products We've Built",
  description:
    "How we've built operational platforms, dashboards, and internal tools that help scaling teams move faster with less manual work.",
  alternates: {
    canonical: `${SITE_URL}/case-studies`,
  },
  openGraph: {
    title: "Case Studies | Rhinon Labs",
    description:
      "Explore real-world client case studies and technical builds delivered by Rhinon Labs.",
    url: `${SITE_URL}/case-studies`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Case Studies | Rhinon Labs",
    description:
      "Explore real-world client case studies and technical builds delivered by Rhinon Labs.",
  },
};

export default async function Page() {
  const caseStudies = await getCaseStudies();
  return <CaseStudiesIndex caseStudies={caseStudies} />;
}
