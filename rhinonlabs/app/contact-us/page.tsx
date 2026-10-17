import { FaqSchema } from "@/components/Common/SEO/PageSchemas";
import ContactUs from "@/components/Pages/ContactUs/ContactUs";
import { Metadata } from "next";

import { SCHEMA_IDS } from "@/lib/site";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.rhinonlabs.com";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Request a discovery call to discuss your internal tools, AI automation, and MVP development challenges. 24-hour response time.",
  alternates: {
    canonical: `${SITE_URL}/contact-us`,
  },
  openGraph: {
    title: "Contact Us | Rhinon Labs",
    description:
      "Get in touch with Rhinon Labs. Discuss your product roadmap, MVP builds, or AI integrations with our team.",
    url: `${SITE_URL}/contact-us`,
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Contact Rhinon Labs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | Rhinon Labs",
    description:
      "Get in touch with Rhinon Labs. Discuss your product roadmap, MVP builds, or AI integrations with our team.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact Rhinon Labs",
  description: "Get in touch with Rhinon Labs for MVP development, AI products, and internal tool builds.",
  url: `${SITE_URL}/contact-us`,
  // The full Organization (address, phone, profiles) is in the site-wide graph
  mainEntity: { "@id": SCHEMA_IDS.organization },
};

export default function page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
      />
      <FaqSchema />
      <ContactUs />
    </>
  );
}