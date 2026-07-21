import CaseStudiesIndex from "@/components/Pages/CaseStudies/CaseStudiesIndex";
import { getCaseStudies } from "@/lib/api";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rhinonlabs.com";

export const metadata: Metadata = {
  title: "Case Studies | Rhinon Labs",
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
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Rhinon Labs Case Studies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Case Studies | Rhinon Labs",
    description:
      "Explore real-world client case studies and technical builds delivered by Rhinon Labs.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

export default async function Page() {
  const caseStudies = await getCaseStudies();
  return <CaseStudiesIndex caseStudies={caseStudies} />;
}
