import Link from "next/link";
import { ArrowUpRight, ChevronRight, IndianRupee, MapPin, Sparkles, Users } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { Aurora, Button, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand, Faq } from "@/components/blocks";
import { FitBlock, LifecycleFlow, ProofStrip } from "@/components/depth";
import { Spot } from "@/components/Spot";
import { comparisonBySlug } from "@/content/compare";
import { GetStartedButton } from "@/components/forms/GetStartedButton";
import { JsonLd, breadcrumbNode, faqNode, graphJsonLd } from "@/components/schema";

/*
 * India landing page for "crm software india" / "indian crm software" (keyword map §3.2).
 * Do not claim "data stored in India", WhatsApp or GST invoicing until each is verified or
 * built (claims register §2.6).
 */

export const metadata = pageMeta({
  title: "CRM Software in India for Service Businesses",
  description: "Indian CRM software for agencies and service teams: an AI agent on your website, AI-drafted outreach and projects with a client portal. Free for up to 5 people, built in India.",
  path: "/in/crm-software",
});

const REASONS = [
  { icon: IndianRupee, title: "Free to start, priced for India", body: "Free for up to 5 people with no card and no time limit. Deal values can be in rupees." },
  { icon: MapPin, title: "Built in India", body: "Made by Rhinon Labs, an Indian team that runs its own agency on it. You talk to the people who build it." },
  { icon: Sparkles, title: "AI that writes like you", body: "Outreach researches each lead and drafts the first email; you approve it before it goes." },
  { icon: Users, title: "More than a CRM", body: "Projects with a client portal, team chat, docs, HR and leave come in the same workspace." },
];

const FAQ = [
  { q: "Is there a free CRM for small businesses in India?", a: "Yes. Rhinon Tech is free for up to 5 people, with 50 emails and 20 AI drafts a day and no time limit. Larger teams move to the Starter plan." },
  { q: "Does Rhinon Tech work with WhatsApp?", a: "Not yet. Today it covers email, website chat and calls." },
  { q: "Can I record deal values in rupees?", a: "Yes. Each deal has a value and a currency, including ₹." },
  { q: "Does Rhinon Tech create GST invoices?", a: "No. There is no invoicing module yet, so keep your accounting tool for GST invoices." },
  { q: "Does it run Indian payroll?", a: "It runs salary, payslips and reimbursements with PF, professional tax and a TDS amount you set. It does not calculate ESI or file returns, so export the run for your CA." },
  { q: "Can I pay in rupees?", a: "The Free plan costs nothing. For Starter, we agree the price with you before anything is set up." },
  { q: "How is it different from Zoho CRM?", a: "Zoho sells CRM, Projects and Desk as separate apps. Rhinon keeps the lead, the deal and the project as one record, and adds an AI agent for your website. See the full Zoho comparison." },
];

/** The tools Indian service businesses most often shortlist, from the dated comparison data. */
const SHORTLIST = ["zoho-alternative", "freshsales-alternative", "bitrix24-alternative", "hubspot-alternative"];
const MARK = { yes: "Yes", partial: "Partly", no: "No", unlisted: "Not listed" } as const;

export default function IndiaCrmPage() {
  return (
    <>
      <section className="relative pb-20 pt-12 sm:pt-16">
        <Aurora />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13.5px] text-muted">
            <Link href="/product/crm" className="hover:text-ink">CRM</Link><ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-ink">India</span>
          </nav>
          <h1 className="font-display mt-6 max-w-[920px] text-balance text-[42px] font-semibold leading-[1.02] sm:text-[66px]">CRM software for Indian service businesses</h1>
          <p className="mt-6 max-w-[720px] text-[18px] leading-8 text-ink-soft">Capture every enquiry, follow up with AI-drafted emails, and turn won deals into projects your clients can follow. Built in India, free for teams of up to 5.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <GetStartedButton placement="India CRM page" />
            <Button href={links.call} variant="soft">Book a demo</Button>
          </div>
          <p className="mt-4 text-[13.5px] text-muted">Free for up to 5 people · No credit card</p>
        </div>
      </section>

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="Why Indian teams choose it" title="A CRM that fits how you work." /></Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 90}>
                <div className="lt-card h-full rounded-2xl p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet/10 text-violet"><Icon className="h-5 w-5" /></span>
                  <p className="font-display mt-5 text-[20px] font-semibold">{title}</p>
                  <p className="mt-2 text-[14.5px] leading-6 text-ink-soft">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-soft/60 py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1240px] gap-4 px-5 md:grid-cols-3">
          {[
            { href: "/features/lead-management", t: "Lead management", d: "Every enquiry in one list, with duplicates flagged." },
            { href: "/features/sales-pipeline", t: "Sales pipeline", d: "Your stages, deal values in ₹ and close dates." },
            { href: "/compare/zoho-alternative", t: "Compared with Zoho One", d: "An honest look at where each one fits." },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="group flex items-start justify-between gap-4 rounded-2xl border border-line bg-white p-6 hover:border-ink/20">
              <span><span className="font-display block text-[20px] font-semibold">{l.t}</span><span className="mt-1 block text-[15px] text-ink-soft">{l.d}</span></span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-soft/60 py-20 sm:py-24">
        <div className="mx-auto max-w-[1100px] px-5">
          <Reveal><SectionHead eyebrow="Shortlist" title="Rhinon Tech and the CRMs Indian teams compare it with." sub="Facts about each tool come from its own pages on the date we checked. Open a comparison for the details." /></Reveal>
          <Spot className="mt-12 overflow-x-auto !rounded-3xl">
            <table className="w-full min-w-[720px] text-left text-[14.5px]">
              <caption className="sr-only">Rhinon Tech compared with CRMs used in India</caption>
              <thead className="bg-soft text-[12px] font-semibold uppercase tracking-wider text-muted">
                <tr><th scope="col" className="px-5 py-3">Tool</th><th scope="col" className="px-5 py-3">Free plan</th><th scope="col" className="px-5 py-3">Projects</th><th scope="col" className="px-5 py-3">AI chat on your site</th><th scope="col" className="px-5 py-3">Pick it if</th></tr>
              </thead>
              <tbody>
                <tr className="border-t border-line align-top bg-[#f6f8ff]"><th scope="row" className="px-5 py-4 font-semibold text-brand">Rhinon Tech</th><td className="px-5 py-4">Yes, up to 5 people</td><td className="px-5 py-4">Yes</td><td className="px-5 py-4">Yes (Starter)</td><td className="px-5 py-4 text-ink-soft">You win clients and deliver projects for them</td></tr>
                {SHORTLIST.map((slug) => comparisonBySlug(slug)).filter(Boolean).map((c) => (
                  <tr key={c!.slug} className="border-t border-line align-top">
                    <th scope="row" className="px-5 py-4 font-semibold"><Link href={`/compare/${c!.slug}`} className="underline-offset-4 hover:underline">{c!.competitor}</Link></th>
                    <td className="px-5 py-4">{MARK[c!.them.free?.mark ?? "unlisted"]}</td>
                    <td className="px-5 py-4">{MARK[c!.them.projects?.mark ?? "unlisted"]}</td>
                    <td className="px-5 py-4">{MARK[c!.them.agent?.mark ?? "unlisted"]}</td>
                    <td className="px-5 py-4 text-ink-soft">{c!.chooseThem[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Spot>
        </div>
      </section>

      <LifecycleFlow />
      <FitBlock good={["You run an agency, consultancy or IT services firm in India", "You want to start free and record deals in rupees", "You want AI to answer website visitors and draft follow-ups", "You want projects, chat and HR next to the CRM"]} />
      <ProofStrip />

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <SectionHead eyebrow="FAQ" title="CRM in India: questions." />
          <div className="mt-12"><Faq items={FAQ} /></div>
        </div>
      </section>

      <CtaBand title={<>Start free, <span className="text-aurora-soft">in minutes.</span></>} sub="Set up a workspace and invite up to 5 people free. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "Book a demo", href: links.call }} />
      <JsonLd data={graphJsonLd([breadcrumbNode([{ name: "Home", path: "/" }, { name: "CRM", path: "/product/crm" }, { name: "CRM software in India", path: "/in/crm-software" }]), faqNode(FAQ)])} />
    </>
  );
}
