import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator, ListChecks } from "lucide-react";
import { SCHEMA_IDS } from "@/lib/site";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { ToolFaqAccordion } from "@/components/Tools/ToolFaqAccordion";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.rhinonlabs.com";

export const metadata: Metadata = {
  title: "Free Tools for Founders & Small Teams",
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
      <section className="pb-16 pt-6 relative">
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

      {/* Supporting Hub Overview Content */}
      <section className="pb-28 pt-12 border-t border-white/[0.08] max-w-[1000px] mx-auto px-6">
        {/* Stacked Cards Layout matching SpotlightCard aesthetic */}
        <div className="flex flex-col gap-6 mb-16">
          <SpotlightCard className="group">
            <div className="p-8 sm:p-10 flex flex-col gap-5">
              <div className="w-fit px-3 py-3 rounded-lg bg-[#10131c] shadow-[inset_0_1px_1px_rgba(207,231,255,0.2)] flex items-center justify-center">
                <ListChecks className="w-5 h-5 text-white/80" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 block">
                  Built For Lean Founders
                </span>
                <h3 className="text-2xl sm:text-[26px] font-semibold text-white tracking-tight mb-3">
                  Why We Built These Free Tools
                </h3>
                <p className="text-white/60 text-[15px] sm:text-base leading-relaxed mb-4">
                  Early-stage startups and small businesses often waste hundreds of hours manually running processes across spreadsheets, messy Notion docs, and unorganized email chains. We built these lightweight calculators and generators to give founders immediate operational clarity — without requiring signups, sales demos, or paywalls.
                </p>
                <p className="text-white/60 text-[15px] sm:text-base leading-relaxed">
                  Every tool reflects real-world engineering and systems data gathered across our client deployments — from pipeline velocity benchmarks to structured 90-day onboarding milestones.
                </p>
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard className="group">
            <div className="p-8 sm:p-10 flex flex-col gap-5">
              <div className="w-fit px-3 py-3 rounded-lg bg-[#10131c] shadow-[inset_0_1px_1px_rgba(207,231,255,0.2)] flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white/80" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 block">
                  Scalable Infrastructure
                </span>
                <h3 className="text-2xl sm:text-[26px] font-semibold text-white tracking-tight mb-3">
                  Moving Beyond Spreadsheets &amp; Disconnected Tools
                </h3>
                <p className="text-white/60 text-[15px] sm:text-base leading-relaxed mb-4">
                  When an operational process outgrows manual spreadsheets, teams usually face two bad extremes: paying steep recurring per-seat SaaS bills for bloated software they barely use, or hiring extra operations headcount to manage the administrative chaos.
                </p>
                <p className="text-white/60 text-[15px] sm:text-base leading-relaxed mb-6">
                  At Rhinon Labs, we engineer custom internal tools, tailored CRM portals, and automated AI agent workflows that your team completely owns from day one.
                </p>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  Explore our custom engineering services <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </SpotlightCard>
        </div>

        {/* FAQs */}
        <div className="pt-6">
          <div className="mb-8">
            <span className="text-xs font-semibold tracking-widest text-[#A3B8CC] uppercase font-sans mb-2 block">
              Got Questions?
            </span>
            <h3 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>
          <ToolFaqAccordion
            items={[
              {
                q: "Are these tools completely free to use?",
                a: "Yes. All tools on this hub are 100% free with no credit card, login, or subscription required. You can generate checklists and calculate ROI models as often as you need.",
              },
              {
                q: "Is my company data stored or shared?",
                a: "No. Calculations run client-side directly in your web browser. We never sell, track, or share your proprietary pipeline metrics or hiring numbers.",
              },
              {
                q: "Can Rhinon Labs build a dedicated custom tool for our team?",
                a: "Yes. If your business requires custom customer portals, internal KPI dashboards, or automated AI agent workflows, we scope, build, and deploy production systems in 2–4 weeks.",
              },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
