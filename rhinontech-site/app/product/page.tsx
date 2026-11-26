import { ArrowUpRight } from "lucide-react";
import { GROUPS, byGroup } from "@/content/products";
import { links, pageMeta } from "@/components/site";
import { Aurora, Button, IconTile, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { Spot } from "@/components/Spot";
import { CtaBand, Faq } from "@/components/blocks";
import { FitBlock, LifecycleFlow, ProofStrip } from "@/components/depth";
import { AppWindow, ProductMock } from "@/components/ProductMocks";
import { JsonLd, faqNode, graphJsonLd } from "@/components/schema";

const FAQ = [
  { q: "Do I need every product?", a: "No. Use one product or all of them. They share one login, and each client has one record across them." },
  { q: "Which products are free?", a: "Every product except the AI Agent is free for up to 5 people, with 50 emails and 20 AI drafts a day and no time limit." },
  { q: "How do the products connect?", a: "The AI Agent saves visitors to the CRM, Outreach follows up from it, a won deal becomes a project with a client portal, and the team chats, writes docs and takes leave in the same workspace." },
  { q: "Can I move my data out?", a: "Yes. Export your leads as a spreadsheet, export your data or delete your workspace at any time." },
];

export const metadata = pageMeta({
  title: "Products",
  description: "Win clients, deliver the work and run your team: CRM, AI Agent, outreach, inbox, projects, chat, docs, HR and payroll in one workspace.",
  path: "/product",
  hasOgImage: true,
});

export default function ProductsPage() {
  return (
    <>
      <section className="relative pb-24 pt-16 sm:pt-24">
        <Aurora />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <Reveal>
            <SectionHead as="h1" eyebrow="Products" title={<>Win clients, deliver the work, <span className="text-aurora">run your team.</span></>} sub="The AI CRM for service businesses, with projects, a client portal, team chat and HR in the same workspace. Use one product or all of them." />
            <div className="mt-9 flex flex-wrap gap-3">
              <Button href={links.signup} arrow>Get started free</Button>
              <Button href={links.call} variant="ghost">Book a demo</Button>
            </div>
          </Reveal>
          <Reveal delay={120} className="mt-14 block"><AppWindow url="rhinontech.in/crm"><ProductMock k="crm" /></AppWindow></Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] space-y-24 px-5 pb-28">
        {GROUPS.map((g) => (
          <section key={g.name}>
            <Reveal>
              <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-violet">{g.name}</p>
              <h2 className="font-display mt-2 text-[34px] font-semibold sm:text-[44px]">{g.line}</h2>
            </Reveal>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {byGroup(g.name).map((p, i) => (
                <Reveal key={p.slug} delay={i * 80}>
                  <Spot href={`/product/${p.slug}`} className="group flex h-full flex-col p-6">
                    <span className="flex items-start justify-between">
                      <IconTile icon={p.icon} tone={p.tone} size={48} />
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-all group-hover:border-transparent group-hover:bg-ink group-hover:text-white"><ArrowUpRight className="h-4 w-4" /></span>
                    </span>
                    <p className="font-display mt-5 flex items-center gap-2 text-[24px] font-semibold">
                      {p.name}
                      {p.premium && <span className="rounded-full bg-pink/15 px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wide text-pink">Premium</span>}
                    </p>
                    <p className="mt-2 text-[15.5px] leading-7 text-ink-soft">{p.short}</p>
                  </Spot>
                </Reveal>
              ))}
            </div>
          </section>
        ))}
      </div>

      <LifecycleFlow />
      <FitBlock good={["You sell services and deliver projects for clients", "You want the CRM, projects and team tools in one login", "You want AI drafts and answers, with a person approving", "You are 5 to 50 people and want to start free"]} />
      <ProofStrip soft count={6} />
      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <SectionHead eyebrow="FAQ" title="Product questions." />
          <div className="mt-12"><Faq items={FAQ} /></div>
        </div>
      </section>
      <CtaBand title={<>All of it, <span className="text-aurora-soft">free for up to 5 people.</span></>} sub="Only the AI Agent is a paid add-on." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "See pricing", href: "/pricing" }} />
      <JsonLd data={graphJsonLd([faqNode(FAQ)])} />
    </>
  );
}
