import { bySlug } from "@/content/products";
import { SITE_URL } from "./site";

/** Canonical JSON-LD @id anchors shared across the sitewide graph. */
export const SCHEMA_IDS = {
  organization: `${SITE_URL}/#organization`,
  website: `${SITE_URL}/#website`,
  app: `${SITE_URL}/#app`,
} as const;

const LOGO_URL = `${SITE_URL}/brand/logo-navy.png`;

const ORGANIZATION_ADDRESS = {
  "@type": "PostalAddress",
  addressLocality: "Hyderabad",
  addressRegion: "Telangana",
  addressCountry: "IN",
};

const ORGANIZATION_CONTACT = {
  "@type": "ContactPoint",
  telephone: "+918249291789",
  contactType: "customer support",
  areaServed: "Worldwide",
  availableLanguage: ["English"],
};

const ORGANIZATION_SAME_AS = [
  "https://www.linkedin.com/company/rhinonlabs",
  "https://x.com/RhinonLabs",
  "https://www.instagram.com/rhinonlabs/",
];

const FREE_OFFER = {
  "@type": "Offer",
  name: "Free Workspace",
  price: 0,
  priceCurrency: "INR",
  url: `${SITE_URL}/pricing`,
  description: "Free access for your whole team to CRM, AI email outreach, shared inbox, projects, Pages, team chat, HR, attendance, payroll, and performance.",
};

const CHATBOT_OFFER = {
  "@type": "Offer",
  name: "AI Chatbot (Premium)",
  priceCurrency: "INR",
  url: `${SITE_URL}/pricing`,
  description: "AI website assistant trained on your site and documents. Custom pricing.",
};

/** Wrap one or more schema.org nodes in a single @graph payload. */
export function graphJsonLd(nodes: Record<string, unknown>[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

/** Render a JSON-LD <script> tag from a structured data object. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

/** Sitewide Organization + WebSite graph rendered in RootLayout. */
export function siteWideGraph() {
  return graphJsonLd([
    {
      "@type": "Organization",
      "@id": SCHEMA_IDS.organization,
      name: "Rhinon Tech",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: LOGO_URL },
      parentOrganization: {
        "@type": "Organization",
        name: "Rhinon Labs",
        url: "https://www.rhinonlabs.com",
      },
      sameAs: ORGANIZATION_SAME_AS,
      contactPoint: ORGANIZATION_CONTACT,
      address: ORGANIZATION_ADDRESS,
    },
    {
      "@type": "WebSite",
      "@id": SCHEMA_IDS.website,
      name: "Rhinon Tech",
      url: SITE_URL,
      publisher: { "@id": SCHEMA_IDS.organization },
    },
  ]);
}

/** Main Rhinon Tech SoftwareApplication node (without aggregateRating). */
export function softwareAppNode() {
  return {
    "@type": "SoftwareApplication",
    "@id": SCHEMA_IDS.app,
    name: "Rhinon Tech",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    provider: { "@id": SCHEMA_IDS.organization },
    offers: [FREE_OFFER, CHATBOT_OFFER],
  };
}

/** Per-module SoftwareApplication node linked to the parent Rhinon Tech suite. */
export function moduleSoftwareAppNode(slug: string) {
  const product = bySlug(slug);
  if (!product) {
    throw new Error(`Unknown product slug for structured data: ${slug}`);
  }
  const url = `${SITE_URL}/product/${product.slug}`;
  return {
    "@type": "SoftwareApplication",
    "@id": `${url}#app`,
    name: `Rhinon ${product.name}`,
    description: product.short,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url,
    isPartOf: { "@id": SCHEMA_IDS.app },
    provider: { "@id": SCHEMA_IDS.organization },
    offers: product.premium ? CHATBOT_OFFER : FREE_OFFER,
  };
}

/** BreadcrumbList node from ordered label/path pairs. */
export function breadcrumbNode(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path.startsWith("http") ? item.path : `${SITE_URL}${item.path}`,
    })),
  };
}

/** FAQPage node built from question/answer pairs. */
export function faqNode(items: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

interface BlogSchemaInput {
  title: string;
  excerpt: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string | null;
  authorName: string;
  coverImage?: string | null;
  faqs?: { question: string; answer: string }[];
}

/** Single @graph combining BlogPosting, BreadcrumbList, and optional FAQPage. */
export function blogPostingGraph(blog: BlogSchemaInput) {
  const url = `${SITE_URL}/blog/${blog.slug}`;
  const nodes: Record<string, unknown>[] = [
    {
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      headline: blog.title,
      description: blog.excerpt,
      datePublished: blog.publishedAt,
      dateModified: blog.updatedAt || blog.publishedAt,
      author: { "@type": "Person", name: blog.authorName },
      publisher: {
        "@type": "Organization",
        "@id": SCHEMA_IDS.organization,
        name: "Rhinon Tech",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: LOGO_URL },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      ...(blog.coverImage ? { image: blog.coverImage } : {}),
    },
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: blog.title, path: `/blog/${blog.slug}` },
    ]),
  ];

  if (blog.faqs?.length) {
    nodes.push(faqNode(blog.faqs.map((f) => ({ q: f.question, a: f.answer }))));
  }

  return graphJsonLd(nodes);
}

