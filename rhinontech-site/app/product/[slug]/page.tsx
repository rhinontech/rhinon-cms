import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, ChevronRight, Sparkles } from "lucide-react";
import { PRODUCTS, bySlug } from "@/content/products";
import { links } from "@/components/site";
import { Aurora, Button, Eyebrow, IconTile, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { Spot } from "@/components/Spot";
import { AppWindow, ProductMock } from "@/components/ProductMocks";
import { CtaBand, Faq, FeaturePanel, faqJsonLd } from "@/components/blocks";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = bySlug(slug);
  if (!p) return {};
  return {
    title: `${p.name}: ${p.short}`,
    description: p.sub,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: `${p.name} | Rhinon Tech`, description: p.sub, url: `/product/${p.slug}` },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = bySlug(slug);
  if (!p) notFound();

  const [from, to] = p.tone;
  const gradient = { backgroundImage: `linear-gradient(100deg, ${from}, ${to})` };
  const related = p.connects.map((c) => ({ ...c, product: bySlug(c.slug)! }));

  return (
    <>
      {/* Hero */}
      <section className="relative pt-12 sm:pt-16">
        <Aurora tones={[from, to, "#ff5fb0"]} />
        <div className="relative mx-auto max-w-[1240px] px-5 text-center">
          <Reveal>
            <nav aria-label="Breadcrumb" className="mb-7 flex items-center justify-center gap-1.5 text-[13.5px] text-muted">
              <Link href="/product" className="hover:text-ink">Product</Link><ChevronRight className="h-3.5 w-3.5" />
              <span>{p.group}</span><ChevronRight className="h-3.5 w-3.5" />
              <span className="font-medium text-ink">{p.name}</span>
            </nav>
            <div className="flex justify-center"><IconTile icon={p.icon} tone={p.tone} size={64} /></div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="font-display mx-auto mt-7 max-w-[960px] text-[42px] font-semibold leading-[1] sm:text-[78px]">
              {p.headline[0]}<br className="hidden sm:block" />{" "}
              <span className="inline-block bg-clip-text text-transparent" style={gradient}>{p.headline[1]}</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-7 max-w-[660px] text-[18px] leading-8 text-ink-soft sm:text-[20px]">{p.sub}</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button href={p.premium ? links.call : links.signup} arrow>{p.premium ? "Talk to us" : "Get started free"}</Button>
              <Button href={p.premium ? links.signup : links.call} variant="ghost">{p.premium ? "Start with the free modules" : "Book a demo"}</Button>
            </div>
            {p.premium && <p className="mt-4 text-[13.5px] text-muted">The AI chatbot is the one paid product. Everything else is free.</p>}
          </Reveal>
        </div>
        <div className="relative mx-auto mt-16 max-w-[980px] px-5 pb-24 sm:pb-32">
          <span aria-hidden className="absolute inset-x-[8%] -bottom-4 top-[30%] rounded-[40px] opacity-40 blur-3xl" style={gradient} />
          <Reveal delay={120} className="relative">
            <AppWindow url={`rhinontech.in/${p.slug}`}><ProductMock k={p.mock} /></AppWindow>
          </Reveal>
        </div>
      </section>

      {/* Outcomes */}
      <section className="border-y border-line bg-soft/60 py-24 sm:py-28">
        <div className="mx-auto grid max-w-[1240px] gap-4 px-5 md:grid-cols-3">
          {p.outcomes.map((o, i) => (
            <Reveal key={o.title} delay={i * 100}>
              <Spot className="h-full p-7">
                <span className="font-mono text-[12px] tracking-[0.16em]" style={{ color: from }}>{`0${i + 1}`}</span>
                <p className="font-display mt-4 text-[24px] font-semibold leading-tight">{o.title}</p>
                <p className="mt-3 text-[15.5px] leading-7 text-ink-soft">{o.body}</p>
              </Spot>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-[1240px] space-y-28 px-5 py-28 sm:space-y-40 sm:py-36">
        {p.features.map((f, i) => (
          <div key={f.title} className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-20 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
            <Reveal>
              <span className="font-mono text-[12px] tracking-[0.16em]" style={{ color: from }}>{`FEATURE 0${i + 1}`}</span>
              <h2 className="font-display mt-4 text-[34px] font-semibold leading-[1.06] sm:text-[46px]">{f.title}</h2>
              <p className="mt-5 text-[17px] leading-8 text-ink-soft">{f.body}</p>
              <ul className="mt-7 space-y-3">
                {f.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-[16px]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white" style={{ background: from }}><Check className="h-3 w-3" strokeWidth={3} /></span>{b}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={120}><FeaturePanel tone={p.tone} bullets={f.bullets} icon={p.icon} /></Reveal>
          </div>
        ))}
      </section>

      {/* AI */}
      {p.ai && (
        <section className="px-5 pb-28 sm:pb-36">
          <Reveal className="noise relative mx-auto max-w-[1240px] overflow-hidden rounded-[40px] bg-night px-6 py-20 text-white sm:px-16">
            <Aurora dark tones={[from, to, "#ff5fb0"]} />
            <div className="relative grid items-center gap-10 lg:grid-cols-[auto_1fr]">
              <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/20 backdrop-blur"><Sparkles className="h-9 w-9 text-[#b9a6ff]" /></span>
              <div>
                <Eyebrow dark>Rhinon AI in {p.name}</Eyebrow>
                <h2 className="font-display mt-5 text-[34px] font-semibold leading-[1.06] sm:text-[48px]">{p.ai.title}</h2>
                <p className="mt-4 max-w-[680px] text-[17px] leading-8 text-white/65">{p.ai.body}</p>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* Connections */}
      <section className="border-y border-line bg-soft/60 py-24 sm:py-28">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal><SectionHead eyebrow="Better together" title={<>Works with the rest of <span className="text-aurora">Rhinon.</span></>} sub={`${p.name} shares one workspace with every other product, so your work flows between them.`} /></Reveal>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {related.map(({ product: r, line }, i) => (
              <Reveal key={r.slug} delay={i * 100}>
                <Spot href={`/product/${r.slug}`} className="group flex h-full flex-col p-6">
                  <span className="flex items-start justify-between"><IconTile icon={r.icon} tone={r.tone} size={44} /><ArrowUpRight className="h-5 w-5 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" /></span>
                  <p className="font-display mt-5 text-[22px] font-semibold">{r.name}</p>
                  <p className="mt-2 text-[15px] leading-6 text-ink-soft">{line}</p>
                </Spot>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[1240px] px-5 py-28 sm:py-32">
        <Reveal><SectionHead eyebrow="FAQ" title={`${p.name} questions, answered.`} /></Reveal>
        <div className="mt-14"><Faq items={p.faq} /></div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(p.faq)) }} />
      </section>

      <CtaBand
        title={p.premium ? <>Put an assistant on <span className="text-aurora-soft">your website.</span></> : <>Start with {p.name}, <span className="text-aurora-soft">free.</span></>}
        sub={p.premium ? "Tell us about your site and we will set up your chatbot with you." : "Set up your workspace in a few minutes and bring your whole team. No credit card, no time limit."}
        primary={p.premium ? { label: "Book a call", href: links.call } : { label: "Get started free", href: links.signup }}
        secondary={{ label: "See all products", href: "/product" }}
      />
    </>
  );
}
