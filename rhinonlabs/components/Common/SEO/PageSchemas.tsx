import { faqs } from "@/components/Common/FAQ/faqs";

import { SCHEMA_IDS } from "@/lib/site";
const json = (data: unknown) => ({ __html: JSON.stringify(data) });

/** FAQPage for pages that render the <FAQ /> section (Google requires the Q&A to be visible). */
export function FaqSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={json({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      })}
    />
  );
}

/** What Rhinon Labs sells — homepage only. */
export function ServiceSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={json({
        "@context": "https://schema.org",
        "@type": "Service",
        serviceType: "AI Automation & Custom Software Development",
        provider: { "@id": SCHEMA_IDS.organization },
        description:
          "We help growing businesses and SMBs build and deploy custom AI agents, workflow automations, and internal dashboards that scale operations without adding headcount.",
        areaServed: "Worldwide",
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Development Services",
          itemListElement: [
            "Workflow Automation",
            "AI Agents & Smart Systems",
            "Custom Internal Dashboards",
            "Websites & Landing Pages",
            "MVP Development",
            "Mobile App Development",
          ].map((name) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name } })),
        },
      })}
    />
  );
}
