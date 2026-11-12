import CaseStudiesIndex from "@/components/Pages/CaseStudies/CaseStudiesIndex";
import { getCaseStudies } from "@/lib/api";
import { Metadata } from "next";
import { SCHEMA_IDS } from "@/lib/site";

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
  const caseStudies = await getCaseStudies().catch(() => []);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/case-studies#webpage`,
    url: `${SITE_URL}/case-studies`,
    name: "Case Studies — Products We've Built",
    description:
      "How we've built operational platforms, dashboards, and internal tools that help scaling teams move faster with less manual work.",
    isPartOf: {
      "@id": SCHEMA_IDS.website,
    },
    about: {
      "@id": SCHEMA_IDS.organization,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: caseStudies.length,
      itemListElement: caseStudies.map((cs, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: cs.title,
        url: `${SITE_URL}/case-studies/${cs.slug}`,
      })),
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Case Studies",
        item: `${SITE_URL}/case-studies`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <CaseStudiesIndex caseStudies={caseStudies} />
    </>
  );
}
