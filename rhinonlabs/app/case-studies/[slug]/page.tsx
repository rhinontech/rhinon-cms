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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cs = await getCaseStudy(slug);

  if (!cs) return { title: "Case Study Not Found" };

  const seoTitle = CASE_STUDY_TITLE_OVERRIDES[cs.slug] || cs.title;
  const ogImage = cs.image || cs.images?.[0] || `${SITE_URL}/og-image.jpg`;

  return {
    title: seoTitle,
    description: cs.description,
    alternates: { canonical: `${SITE_URL}/case-studies/${cs.slug}` },
    openGraph: {
      title: seoTitle,
      description: cs.description,
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
      description: cs.description,
      images: [ogImage],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const cs = await getCaseStudy(slug);

  if (!cs) notFound();

  return <CaseStudyDetail caseStudy={cs} />;
}
