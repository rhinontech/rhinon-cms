import { Metadata } from "next";
import EmployeeOnboardingChecklist from "@/components/Tools/EmployeeOnboardingChecklist";
import { OnboardingGuideContent } from "@/components/Tools/OnboardingGuideContent";
import { SCHEMA_IDS } from "@/lib/site";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.rhinonlabs.com";

export const metadata: Metadata = {
  title: "Free Employee Onboarding Checklist Generator",
  description:
    "Generate a free, phase-by-phase employee onboarding checklist for your small company. Enter your company name and download a printable checklist in seconds.",
  alternates: { canonical: `${SITE_URL}/tools/employee-onboarding-checklist` },
  openGraph: {
    title: "Free Employee Onboarding Checklist Generator",
    description:
      "Generate a complete onboarding checklist for new hires — free, no login required.",
    url: `${SITE_URL}/tools/employee-onboarding-checklist`,
    type: "website",
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "Employee Onboarding Checklist Generator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Employee Onboarding Checklist Generator",
    description: "Generate a complete onboarding checklist for new hires — free, no login required.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

export default function EmployeeOnboardingChecklistPage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Free Tools", item: `${SITE_URL}/tools` },
      { "@type": "ListItem", position: 3, name: "Employee Onboarding Checklist", item: `${SITE_URL}/tools/employee-onboarding-checklist` },
    ],
  };

  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Employee Onboarding Checklist Generator",
    url: `${SITE_URL}/tools/employee-onboarding-checklist`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    description:
      "Generate a free, phase-by-phase employee onboarding checklist for small companies. Covers pre-Day 1, Day 1, Week 1, Month 1, and Month 3.",
    provider: { "@id": SCHEMA_IDS.organization },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }} />
      <EmployeeOnboardingChecklist />
      <OnboardingGuideContent />
    </>
  );
}
