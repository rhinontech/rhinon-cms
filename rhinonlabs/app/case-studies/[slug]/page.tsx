import CaseStudyDetail from "@/components/Pages/CaseStudies/CaseStudyDetail";
import { getCaseStudy } from "@/lib/api";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.rhinonlabs.com";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Crisp titles trimmed under 60 characters for Google SERP display (SEO Audit #10) */
const CASE_STUDY_TITLE_OVERRIDES: Record<string, string> = {
  "furrcircle-the-all-in-one-app-for-pet-parents": "FurrCircle Pet Parent App – Case Study",
};

/** Meta descriptions trimmed between 140-155 characters for Google SERP display (SEO Audit #11) */
const CASE_STUDY_DESCRIPTION_OVERRIDES: Record<string, string> = {
  "furrcircle-the-all-in-one-app-for-pet-parents":
    "How Rhinon Labs built FurrCircle: a cross-platform pet care mobile app with vet booking, health records, and an automated admin dashboard.",
  srfitout:
    "How Rhinon Labs built an interactive design studio and quoting web platform for SR Fitout, generating 3x more qualified client enquiries.",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cs = await getCaseStudy(slug);

  if (!cs) return { title: "Case Study Not Found" };

  const seoTitle = CASE_STUDY_TITLE_OVERRIDES[cs.slug] || cs.title;
  const seoDescription = CASE_STUDY_DESCRIPTION_OVERRIDES[cs.slug] || cs.description;
  const ogImage = cs.image || cs.images?.[0] || `${SITE_URL}/og-image.jpg`;

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: { canonical: `${SITE_URL}/case-studies/${cs.slug}` },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: `${SITE_URL}/case-studies/${cs.slug}`,
      type: "article",
      images: [
        {
          url: ogImage,
          alt: seoTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: [ogImage],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const cs = await getCaseStudy(slug);

  if (!cs) notFound();

  const title = CASE_STUDY_TITLE_OVERRIDES[cs.slug] || cs.title;
  const pageUrl = `${SITE_URL}/case-studies/${cs.slug}`;

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
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <CaseStudyDetail caseStudy={cs} />
    </>
  );
}
