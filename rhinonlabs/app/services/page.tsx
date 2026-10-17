import type { Metadata } from "next";
import ServicesIndex from "@/components/Pages/Services/ServicesIndex";
import { FaqSchema } from "@/components/Common/SEO/PageSchemas";
import { services } from "@/lib/services";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.rhinonlabs.com";

export const metadata: Metadata = {
  title: "Services — MVPs, AI Agents, Automation & Apps",
  description:
    "What Rhinon Labs builds: MVPs for startups, AI agents, workflow automation, internal dashboards, websites, web apps and mobile apps — delivered in weeks.",
  alternates: { canonical: `${SITE_URL}/services` },
  openGraph: {
    title: "Services | Rhinon Labs",
    description: "MVPs, AI agents, workflow automation, internal tools, websites and mobile apps — delivered in weeks.",
    url: `${SITE_URL}/services`,
    type: "website",
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "Rhinon Labs services" }],
  },
};

export default function ServicesPage() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.name,
      url: `${SITE_URL}/services/${s.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <FaqSchema />
      <ServicesIndex />
    </>
  );
}
