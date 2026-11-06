import Image from "next/image";
import { Check, Plus } from "lucide-react";
import { Aurora, Button } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import type { Product } from "@/content/products";

const SPOTS = [
  { left: "6%", top: "12%", rotate: "-3deg", float: "float-a" },
  { left: "22%", top: "42%", rotate: "2deg", float: "float-b" },
  { left: "8%", top: "70%", rotate: "-1.5deg", float: "float-c" },
  { left: "26%", top: "92%", rotate: "2deg", float: "float-a" },
];

/** A product's gradient with its feature points floating on it like notifications. */
export function FeaturePanel({ tone, bullets, icon: Icon }: { tone: Product["tone"]; bullets: string[]; icon: Product["icon"] }) {
  return (
    <div
      className="noise relative aspect-[5/4] w-full overflow-hidden rounded-[32px]"
      style={{ background: `radial-gradient(90% 80% at 100% 0%, ${tone[1]}, transparent 60%), linear-gradient(145deg, ${tone[0]}, ${tone[1]})` }}
    >
      <svg viewBox="0 0 400 300" fill="none" aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-[75%] w-[85%] opacity-70">
        <path d="M60 300C80 170 170 70 300 30" stroke="white" strokeOpacity="0.85" strokeWidth="9" strokeLinecap="round" />
        <path d="M115 300C135 200 205 120 320 85" stroke="white" strokeOpacity="0.6" strokeWidth="9" strokeLinecap="round" />
      </svg>
      <span className="absolute right-6 top-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white ring-1 ring-white/40 backdrop-blur"><Icon className="h-7 w-7" /></span>
      {bullets.slice(0, SPOTS.length).map((b, i) => (
        <div key={b} className="absolute max-w-[80%]" style={{ left: SPOTS[i].left, top: SPOTS[i].top, transform: `translateY(-50%) rotate(${SPOTS[i].rotate})` }}>
          <div className={`${SPOTS[i].float} glass-chip flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[14px] font-semibold`}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white" style={{ background: tone[0] }}><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
            {b}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Faq({ items, dark = false }: { items: { q: string; a: string }[]; dark?: boolean }) {
  return (
    <div className="mx-auto max-w-[820px] space-y-3">
      {items.map((f) => (
        <details key={f.q} className={`group rounded-2xl border transition-colors ${dark ? "border-white/10 bg-white/[0.04] open:bg-white/[0.07]" : "border-line bg-white open:shadow-[0_20px_40px_-28px_rgb(40_30_140_/_0.35)]"}`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 group-open:rotate-45 group-open:border-transparent group-open:bg-violet group-open:text-white ${dark ? "border-white/20" : "border-line"}`}><Plus className="h-4 w-4" /></span>
          </summary>
          <p className={`px-6 pb-6 pr-16 text-[16px] leading-7 ${dark ? "text-white/65" : "text-ink-soft"}`}>{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function CtaBand({
  title,
  sub,
  primary,
  secondary,
}: {
  title: React.ReactNode;
  sub: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="px-5 pb-24 sm:pb-32">
      <Reveal className="noise relative mx-auto max-w-[1240px] overflow-hidden rounded-[40px] bg-night px-6 py-20 text-center text-white sm:py-28">
        <Aurora dark />
        <Image src="/brand/mark-white.png" alt="" width={520} height={520} aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 w-[380px] opacity-[0.06]" />
        <div className="relative">
          <h2 className="font-display mx-auto max-w-[780px] text-[38px] font-semibold leading-[1.04] sm:text-[60px]">{title}</h2>
          <p className="mx-auto mt-5 max-w-[520px] text-[17px] leading-8 text-white/65">{sub}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button href={primary.href} arrow>{primary.label}</Button>
            {secondary && <Button href={secondary.href} variant="glass">{secondary.label}</Button>}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
