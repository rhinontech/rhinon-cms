import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator, ListChecks } from "lucide-react";
import { SCHEMA_IDS } from "@/lib/site";
import { SpotlightCard } from "@/components/ui/spotlight-card";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.rhinonlabs.com";

export const metadata: Metadata = {
  title: "Free Tools for Founders & Small Teams — Rhinon Labs",
  description:
    "Free calculators and generators to help you automate onboarding, measure CRM ROI, and scale your operations without adding headcount.",
  alternates: { canonical: `${SITE_URL}/tools` },
  openGraph: {
    title: "Free Tools — Rhinon Labs",
    description: "Free calculators and generators for founders and small teams.",
    url: `${SITE_URL}/tools`,
    type: "website",
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "Rhinon Labs Free Tools" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Tools — Rhinon Labs",
    description: "Free calculators and generators for founders and small teams.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

const TOOLS = [
  {
    slug: "employee-onboarding-checklist",
    icon: ListChecks,
    eyebrow: "HR & Operations",
    title: "Employee Onboarding Checklist Generator",
    description:
      "Generate a complete, phase-by-phase onboarding checklist for your new hire. Enter your company name and get a printable checklist in seconds.",
    cta: "Generate checklist",
  },
  {
    slug: "crm-roi-calculator",
    icon: Calculator,
    eyebrow: "Sales & Revenue",
    title: "CRM ROI Calculator",
    description:
      "See how much revenue your sales team is leaving on the table without a proper CRM. Enter your numbers and get an instant ROI estimate.",
    cta: "Calculate ROI",
  },
];

export default function ToolsPage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Free Tools", item: `${SITE_URL}/tools` },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/tools#webpage`,
    url: `${SITE_URL}/tools`,
    name: "Free Tools for Founders & Small Teams",
    isPartOf: { "@id": SCHEMA_IDS.website },
    about: { "@id": SCHEMA_IDS.organization },
  };

  return (
    <div className="relative flex flex-col selection:bg-[#1c2bff]/50 overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pt-40 max-sm:pt-28 pb-10 px-5 max-w-5xl mx-auto w-full flex flex-col items-center">
          <div className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium tracking-widest text-[#A3B8CC] uppercase font-sans">Free Tools</span>
          </div>
          <h1 className="text-[40px] text-center sm:text-5xl md:text-[64px] font-sans font-normal leading-[1.1] tracking-[-0.02em] max-w-4xl py-2 text-transparent bg-clip-text bg-linear-to-b from-white to-white/80 mb-6">
            Tools for founders &amp; <br className="hidden sm:block" />
            <span className="font-serif italic">small teams</span>
          </h1>
          <p className="text-white/70 text-center sm:text-lg max-w-2xl">
            Free calculators and generators to help you automate operations, measure ROI, and make faster decisions — no login required.
          </p>
        </div>
      </section>

      {/* Tool cards */}
      <section className="pb-28 pt-6 relative">
        <div className="max-w-[1000px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.slug} href={`/tools/${tool.slug}`} className="block h-full">
                <SpotlightCard className="group h-full">
                  <div className="p-8 flex flex-col gap-5 h-full">
                    <div className="w-fit px-3 py-3 rounded-lg bg-[#10131c] shadow-[inset_0_1px_1px_rgba(207,231,255,0.2)] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white/80" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">{tool.eyebrow}</span>
                      <h2 className="text-[22px] font-semibold text-white mb-2 tracking-tight">{tool.title}</h2>
                      <p className="text-white/50 text-[15px] leading-relaxed mb-6">{tool.description}</p>
                      <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                        {tool.cta} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </SpotlightCard>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
