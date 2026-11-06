import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { GROUPS, byGroup } from "@/content/products";
import { links } from "@/components/site";
import { Aurora, Button, IconTile, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { Spot } from "@/components/Spot";
import { CtaBand } from "@/components/blocks";

export const metadata: Metadata = {
  title: "Products",
  description: "CRM, outreach, inbox, AI chatbot, projects, team chat, HR, payroll, attendance and performance in one workspace.",
  alternates: { canonical: "/product" },
};

export default function ProductsPage() {
  return (
    <>
      <section className="relative pb-24 pt-16 sm:pt-24">
        <Aurora />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <Reveal>
            <SectionHead eyebrow="Products" title={<>Everything your company runs on, <span className="text-aurora">in one place.</span></>} sub="Use one product or all eleven. They share one workspace, one login and one memory." />
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button href={links.signup} arrow>Get started free</Button>
              <Button href={links.call} variant="ghost">Book a demo</Button>
            </div>
          </Reveal>
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

      <CtaBand title={<>All of it, <span className="text-aurora-soft">free for your team.</span></>} sub="Only the AI website chatbot is a paid product." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "See pricing", href: "/pricing" }} />
    </>
  );
}
