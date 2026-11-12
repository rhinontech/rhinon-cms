import { getBlogs } from "@/lib/api";
import SearchableBlogs from "@/components/Pages/Blogs/SearchableBlogs";
import { Metadata } from "next";
import { SCHEMA_IDS } from "@/lib/site";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.rhinonlabs.com";

export const metadata: Metadata = {
  title: "Blog — Startup, Automation & AI Insights",
  description:
    "Deep dives into MVP development, AI engineering, internal tools, and rapid growth strategies for modern founders.",
  alternates: {
    canonical: `${SITE_URL}/blogs`,
  },
  openGraph: {
    title: "Blogs & Insights | Rhinon Labs",
    description:
      "Deep dives into MVP development, AI engineering, internal tools, and rapid growth strategies for modern founders.",
    url: `${SITE_URL}/blogs`,
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Rhinon Labs Blogs & Insights",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blogs & Insights | Rhinon Labs",
    description:
      "Deep dives into MVP development, AI engineering, internal tools, and rapid growth strategies for modern founders.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

export default async function BlogsPage() {
  const blogs = await getBlogs().catch(() => []);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/blogs#webpage`,
    url: `${SITE_URL}/blogs`,
    name: "Blog — Startup, Automation & AI Insights",
    description:
      "Deep dives into MVP development, AI engineering, internal tools, and rapid growth strategies for modern founders.",
    isPartOf: {
      "@id": SCHEMA_IDS.website,
    },
    about: {
      "@id": SCHEMA_IDS.organization,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: blogs.length,
      itemListElement: blogs.map((blog, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: blog.title,
        url: `${SITE_URL}/blogs/${blog.slug}`,
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
        name: "Blog",
        item: `${SITE_URL}/blogs`,
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
      <SearchableBlogs initialBlogs={blogs} />
    </>
  );
}
