import { faqs } from "@/components/Common/FAQ/faqs";

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
        serviceType: "MVP Development & AI Automation",
        provider: { "@type": "Organization", name: "Rhinon Labs", url: "https://www.rhinonlabs.com" },
        description:
          "We help founders and SMBs design, build and launch websites, apps and AI products fast with affordable pricing.",
        areaServed: "Worldwide",
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Development Services",
          itemListElement: [
            "MVP Development",
            "Custom Internal Dashboards",
            "Workflow Automation",
            "AI Agents & Smart Systems",
            "Websites & Landing Pages",
            "Mobile App Development",
          ].map((name) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name } })),
        },
      })}
    />
  );
}
