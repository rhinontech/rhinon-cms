import { COMPANY, SCHEMA_IDS, SITE_URL } from "@/lib/site";
import { services } from "@/lib/services";

// Site-wide schema (every page): the Organization and WebSite entities, linked by
// @id so page-level schema (Service, FAQPage, BlogPosting…) can point at the same
// company instead of re-describing it. Page-specific schema lives with its page.
export default function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": SCHEMA_IDS.organization,
        name: COMPANY.name,
        url: SITE_URL,
        description: COMPANY.description,
        slogan: COMPANY.tagline,
        logo: {
          "@type": "ImageObject",
          url: COMPANY.logo,
        },
        image: `${SITE_URL}/og-image.jpg`,
        address: {
          "@type": "PostalAddress",
          addressLocality: COMPANY.address.locality,
          addressRegion: COMPANY.address.region,
          addressCountry: COMPANY.address.country,
        },
        areaServed: COMPANY.areaServed,
        sameAs: [...COMPANY.sameAs],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: COMPANY.phoneE164,
          contactType: "sales",
          areaServed: COMPANY.areaServed,
          availableLanguage: [...COMPANY.languages],
          url: `${SITE_URL}/contact-us`,
        },
        // What the company does — helps search and AI systems classify the entity
        knowsAbout: [
          "MVP development",
          "AI agents",
          "Workflow automation",
          "Internal tools and dashboards",
          "Web application development",
          "Mobile app development",
          "Startup product development",
        ],
        makesOffer: services.map((s) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: s.name,
            url: `${SITE_URL}/services/${s.slug}`,
          },
        })),
      },
      {
        "@type": "WebSite",
        "@id": SCHEMA_IDS.website,
        name: COMPANY.name,
        url: SITE_URL,
        description: COMPANY.description,
        inLanguage: "en",
        publisher: { "@id": SCHEMA_IDS.organization },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
