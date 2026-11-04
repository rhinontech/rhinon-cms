import CaseStudyDetail from "@/components/Pages/CaseStudies/CaseStudyDetail";
import { getCaseStudy } from "@/lib/api";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.rhinonlabs.com";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cs = await getCaseStudy(slug);

  if (!cs) return { title: "Case Study Not Found" };

  const ogImage = cs.image || cs.images?.[0] || `${SITE_URL}/og-image.jpg`;

  return {
    title: cs.title,
    description: cs.description,
    alternates: { canonical: `${SITE_URL}/case-studies/${cs.slug}` },
    openGraph: {
      title: cs.title,
      description: cs.description,
      url: `${SITE_URL}/case-studies/${cs.slug}`,
      type: "article",
      images: [
        {
          url: ogImage,
          alt: cs.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: cs.title,
      description: cs.description,
      images: [ogImage],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const cs = await getCaseStudy(slug);

  if (!cs) notFound();

  const title = cs.title;
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
