import { Metadata } from "next";
import CrmRoiCalculator from "@/components/Tools/CrmRoiCalculator";
import { SCHEMA_IDS } from "@/lib/site";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.rhinonlabs.com";

export const metadata: Metadata = {
  title: "Free CRM ROI Calculator — Rhinon Labs",
  description:
    "Calculate how much revenue your sales team is leaving on the table without a CRM. Enter team size, deal value, and win rate — get an instant ROI estimate.",
  alternates: { canonical: `${SITE_URL}/tools/crm-roi-calculator` },
  openGraph: {
    title: "Free CRM ROI Calculator",
    description:
      "See how much revenue a CRM could add to your sales team. Free, instant, no login required.",
    url: `${SITE_URL}/tools/crm-roi-calculator`,
    type: "website",
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "CRM ROI Calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free CRM ROI Calculator",
    description: "See how much revenue a CRM could add to your sales team. Free, instant.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

export default function CrmRoiCalculatorPage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Free Tools", item: `${SITE_URL}/tools` },
      { "@type": "ListItem", position: 3, name: "CRM ROI Calculator", item: `${SITE_URL}/tools/crm-roi-calculator` },
    ],
  };

  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "CRM ROI Calculator",
    url: `${SITE_URL}/tools/crm-roi-calculator`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    description:
      "Free CRM ROI calculator for small sales teams. Enter team size, average deal value, and current win rate to see projected revenue uplift and time saved.",
    provider: { "@id": SCHEMA_IDS.organization },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }} />
      <CrmRoiCalculator />
    </>
  );
}
