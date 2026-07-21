import ContactUs from "@/components/Pages/ContactUs/ContactUs";
import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rhinonlabs.com";

export const metadata: Metadata = {
  title: "Contact Us | Rhinon Labs",
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
  mainEntity: {
    "@type": "Organization",
    name: "Rhinon Labs",
    url: SITE_URL,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91 9664430061",
      contactType: "Sales & Support",
      availableLanguage: ["English"],
    },
  },
};

export default function page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
      />
      <ContactUs />
    </>
  );
}