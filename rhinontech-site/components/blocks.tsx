import Image from "next/image";
import { ChevronDown } from "lucide-react";
import type { MockKey } from "@/content/products";
import { Button } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { AppWindow, ProductMock } from "@/components/ProductMocks";
import { GetStartedButton } from "@/components/forms/GetStartedButton";

/** Questions as a quiet list: hairline rules and a chevron, no boxes (native <details>, no JS). */
export function Faq({ items, dark = false }: { items: { q: string; a: string }[]; dark?: boolean }) {
  return (
    <div className={`mx-auto max-w-[860px] divide-y border-y ${dark ? "divide-white/10 border-white/10" : "divide-line border-line"}`}>
      {items.map((f) => (
        <details key={f.q} className="group">
          <summary className={`flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] font-semibold transition-colors [&::-webkit-details-marker]:hidden ${dark ? "text-white hover:text-white/80" : "text-ink hover:text-[#5b3df5]"}`}>
            {f.q}
            <ChevronDown className={`h-5 w-5 shrink-0 transition-transform duration-300 group-open:rotate-180 ${dark ? "text-white/50" : "text-muted"}`} />
          </summary>
          <p className={`pb-6 pr-10 text-[16px] leading-7 ${dark ? "text-white/65" : "text-ink-soft"}`}>{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/**
 * The closing band: a vivid brand-gradient panel (or a product's own colours), with an optional
 * product picture rising from its lower edge.
 */
export function CtaBand({
  title,
  sub,
  primary,
  secondary,
  tone,
  peek,
  placement,
}: {
  title: React.ReactNode;
  sub: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  /** Tints the band with a product's colours. */
  tone?: [string, string];
  /** A product picture that rises from the bottom of the band. */
  peek?: MockKey;
  /** When set, the primary button captures the visitor as a lead first (GetStartedButton). */
  placement?: string;
}) {
  const tint = tone ? { background: `radial-gradient(80% 120% at 85% 110%, ${tone[1]}99, transparent 60%), linear-gradient(120deg, #0a0f2e 0%, ${tone[0]} 55%, ${tone[1]} 100%)` } : undefined;
  return (
    <section className="px-5 pb-24 pt-4 sm:pb-32">
      <Reveal className={`cta-vivid relative mx-auto max-w-[1240px] overflow-hidden rounded-[32px] px-6 text-center text-white ${peek ? "pt-20 sm:pt-24" : "py-20 sm:py-28"}`}>
        <div aria-hidden className="absolute inset-0" style={tint} />
        <Image src="/brand/mark-white.png" alt="Rhinon Tech logo" width={520} height={520} aria-hidden className="pointer-events-none absolute -right-16 -top-20 w-[340px] opacity-[0.07]" />
        <div className="relative">
          <h2 className="font-display no-fade mx-auto max-w-[820px] text-balance text-[36px] leading-[1.04] sm:text-[56px]">{title}</h2>
          <p className="mx-auto mt-5 max-w-[540px] text-[17px] leading-8 text-white/80">{sub}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {placement ? <GetStartedButton placement={placement} variant="primary">{primary.label}</GetStartedButton> : <Button href={primary.href} arrow>{primary.label}</Button>}
            {secondary && <Button href={secondary.href} variant="glass">{secondary.label}</Button>}
          </div>
        </div>
        {peek && (
          <div aria-hidden className="relative mx-auto mt-14 max-w-[880px] translate-y-6 text-left text-ink [mask-image:linear-gradient(#000_55%,transparent)] sm:mt-16">
            <AppWindow><ProductMock k={peek} /></AppWindow>
          </div>
        )}
      </Reveal>
    </section>
  );
}
