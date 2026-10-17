import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceDetail from "@/components/Pages/Services/ServiceDetail";
import { getService, services } from "@/lib/services";
import { getBlogs } from "@/lib/api";

import { SCHEMA_IDS } from "@/lib/site";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.rhinonlabs.com";

// Pages are static; related blogs/case studies refresh hourly
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  const url = `${SITE_URL}/services/${service.slug}`;
  return {
    title: service.metaTitle,
    description: service.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: `${service.metaTitle} | Rhinon Labs`,
      description: service.metaDescription,
      url,
      type: "website",
      images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: service.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${service.metaTitle} | Rhinon Labs`,
      description: service.metaDescription,
      images: [`${SITE_URL}/og-image.jpg`],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  // Related posts are a bonus — never fail the page if the content API is down
  const blogs = await getBlogs().catch(() => []);
  const related = service.relatedBlogs
    .map((s) => blogs.find((b) => b.slug === s))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  const url = `${SITE_URL}/services/${service.slug}`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${url}#service`,
      name: service.name,
      serviceType: service.name,
      description: service.metaDescription,
      url,
      areaServed: "Worldwide",
      provider: { "@id": SCHEMA_IDS.organization },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: service.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Services", item: `${SITE_URL}/services` },
        { "@type": "ListItem", position: 3, name: service.name, item: url },
      ],
    },
  ];

  return (
    <>
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <ServiceDetail service={service} blogs={related} />
    </>
  );
}
