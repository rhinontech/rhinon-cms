import Link from "next/link";
import { ArrowUpRight, Check, MousePointer2, X, type LucideIcon } from "lucide-react";
import type { MockKey } from "@/content/products";
import { CAPABILITY_GROUPS, capabilitiesIn, capabilityHref } from "@/content/capabilities";
import { AppWindow, ProductMock } from "@/components/ProductMocks";
import { Reveal } from "@/components/Reveal";

/*
 * Design system v2 building blocks (see the v2 block in app/globals.css). Server components with
 * CSS-only motion: every word is in the HTML, and nothing waits for JavaScript to appear.
 */

const MONO_LABEL = "font-mono text-[11.5px] font-medium uppercase tracking-[0.14em]";

/** The one badge in a hero, with a slowly rotating gradient ring. */
export function RingBadge({ children, href }: { children: React.ReactNode; href?: string }) {
  const cls = "ring-badge inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[14px] font-medium text-ink";
  return href ? <Link href={href} className={`${cls} hover:text-[#5b3df5]`}>{children}</Link> : <p className={cls}>{children}</p>;
}

const APP_PATH: Partial<Record<MockKey, string>> = { chatbot: "ai-agent", work: "projects", pages: "docs" };

/**
 * A product window on a vivid plate, with a pulsing callout and a teammate's cursor drifting over
 * it: the "show the product" moment of a page. `tones` recolours the plate.
 */
export function ProductStage({
  k,
  chip,
  tones,
  className = "",
}: {
  k: MockKey;
  chip?: { title: string; sub: string };
  tones?: [string, string, string];
  className?: string;
}) {
  const vars = tones ? ({ "--stage-a": tones[0], "--stage-b": tones[1], "--stage-c": tones[2] } as React.CSSProperties) : undefined;
  return (
    <div className={`stage p-4 sm:p-8 ${className}`} style={vars}>
      <div className="relative z-10">
        <AppWindow url={`rhinontech.in/${APP_PATH[k] ?? k}`}>
          <ProductMock k={k} />
        </AppWindow>
        {chip && (
          <div className="hl-ring absolute -bottom-3 right-3 z-20 max-w-[260px] rounded-xl bg-white px-3.5 py-2.5 sm:-right-3 sm:bottom-10">
            <p className="text-[13px] font-semibold text-ink">{chip.title}</p>
            <p className="text-[11.5px] text-muted">{chip.sub}</p>
          </div>
        )}
        <span aria-hidden className="cursor-drift absolute left-[38%] top-[34%] z-20 hidden items-start sm:flex">
          <MousePointer2 className="h-5 w-5 fill-[#ff5fb0] text-white drop-shadow" />
          <span className="ml-0.5 mt-4 rounded-md bg-[#ff5fb0] px-1.5 py-0.5 text-[11px] font-semibold text-white">Ana</span>
        </span>
        <span aria-hidden className="cursor-drift-b absolute left-[68%] top-[62%] z-20 hidden items-start sm:flex">
          <MousePointer2 className="h-5 w-5 fill-[#2f5bff] text-white drop-shadow" />
          <span className="ml-0.5 mt-4 rounded-md bg-[#2f5bff] px-1.5 py-0.5 text-[11px] font-semibold text-white">Dev</span>
        </span>
      </div>
    </div>
  );
}

/** Big numbers in hairline columns, each with a violet mono label and a plain-English note. */
const STAT_COLS: Record<number, string> = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };

export function StatRow({ items, footnote, dark = false }: { items: { label: string; value: string; note: string }[]; footnote?: React.ReactNode; dark?: boolean }) {
  const rule = dark ? "border-white/10" : "border-line";
  return (
    <div>
      <div className={`grid grid-cols-2 border-t ${STAT_COLS[Math.min(items.length, 4)] ?? "lg:grid-cols-4"} ${rule}`}>
        {items.map((s, i) => (
          <Reveal key={s.label} delay={(i % 4) * 80} className={`border-b py-7 pr-5 sm:py-8 max-lg:even:border-l max-lg:even:pl-5 lg:border-l lg:pl-6 lg:first:border-l-0 lg:first:pl-0 ${rule}`}>
            <p className={`${MONO_LABEL} ${dark ? "text-[#b3a6ff]" : "text-[#5b3df5]"}`}>{s.label}</p>
            <p className={`font-display mt-3 text-[40px] font-bold leading-none tracking-[-0.04em] sm:text-[48px] ${dark ? "text-white" : "text-ink"}`}>{s.value}</p>
            <p className={`mt-4 text-[14px] leading-6 ${dark ? "text-white/55" : "text-muted"}`}>{s.note}</p>
          </Reveal>
        ))}
      </div>
      {footnote && <p className={`mt-5 text-[13px] ${dark ? "text-white/45" : "text-muted"}`}>{footnote}</p>}
    </div>
  );
}

/** Every capability in hairline cells, grouped the way a service business works. */
export function CapabilityGrid() {
  return (
    <div className="space-y-12">
      {CAPABILITY_GROUPS.map((g) => (
        <div key={g.name}>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <p className={`${MONO_LABEL} text-[#5b3df5]`}>{g.name}</p>
            <p className="text-[14px] text-muted">{g.line}</p>
          </div>
          <ul className="hair-open grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {capabilitiesIn(g.name).map((c) => {
              const Icon = c.icon;
              return (
                <li key={c.label}>
                  <Link href={capabilityHref(c)} className="group flex h-full items-start gap-3 p-4 transition-colors hover:bg-[#f7f6ff]">
                    <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-muted transition-colors group-hover:text-[#5b3df5]" strokeWidth={1.8} />
                    <span className="text-[14px] font-medium leading-5 text-ink">
                      {c.label}
                      {c.paid && <span className="ml-1.5 align-middle rounded-full bg-pink/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c2307f]">Starter</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Three problems in a row, each with a quiet icon tile. */
export function PainRow({ items }: { items: { icon: LucideIcon; title: string; body: string }[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-line">
      {items.map(({ icon: Icon, title, body }) => (
        <li key={title} className="flex gap-4 sm:px-7 sm:first:pl-0 sm:last:pr-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f1efff] text-[#5b3df5]"><Icon className="h-5 w-5" strokeWidth={1.9} /></span>
          <span><span className="block text-[15.5px] font-semibold text-ink">{title}</span><span className="mt-1 block text-[14.5px] leading-6 text-muted">{body}</span></span>
        </li>
      ))}
    </ul>
  );
}

/** "The old way" against "the Rhinon way", split by one hairline. */
export function OldNew({ old, next, cta }: { old: string[]; next: string[]; cta?: React.ReactNode }) {
  return (
    <div className="hair md:grid-cols-2">
      <div className="p-7 sm:p-10">
        <p className="font-display text-[24px] font-semibold tracking-[-0.03em] text-ink">The old way</p>
        <ul className="mt-6 space-y-3.5">
          {old.map((t) => <li key={t} className="flex gap-3 text-[15.5px] leading-6 text-ink-soft"><X className="mt-1 h-4 w-4 shrink-0 text-rose-500" strokeWidth={2.5} />{t}</li>)}
        </ul>
      </div>
      <div className="bg-[#fbfbff] p-7 sm:p-10">
        <p className="font-display text-[24px] font-semibold tracking-[-0.03em] text-ink">The Rhinon way</p>
        <ul className="mt-6 space-y-3.5">
          {next.map((t) => <li key={t} className="flex gap-3 text-[15.5px] font-medium leading-6 text-ink"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} />{t}</li>)}
        </ul>
        {cta && <div className="mt-8">{cta}</div>}
      </div>
    </div>
  );
}

/** Text and product pictures in a checkerboard: each row swaps sides, cells share hairlines. */
export function Checker({ rows }: { rows: { eyebrow?: string; title: string; body: string; k: MockKey; href?: string }[] }) {
  return (
    <div className="hair">
      {rows.map((r, i) => (
        <div key={r.title} className="grid lg:grid-cols-2">
          <div className={`flex flex-col justify-center p-8 sm:p-12 ${i % 2 ? "lg:order-2" : ""}`}>
            {r.eyebrow && <p className={`${MONO_LABEL} text-[#5b3df5]`}>{r.eyebrow}</p>}
            <h3 className="font-display mt-3 text-balance text-[28px] font-bold leading-[1.08] tracking-[-0.04em] text-ink sm:text-[36px]">{r.title}</h3>
            <p className="mt-4 max-w-[480px] text-[16.5px] leading-7 text-ink-soft">{r.body}</p>
            {r.href && <Link href={r.href} className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink hover:text-[#5b3df5]">See how it works <ArrowUpRight className="h-4 w-4" /></Link>}
          </div>
          <div className={`relative overflow-hidden border-line bg-[#f5f6fb] p-6 max-lg:border-t sm:p-10 ${i % 2 ? "lg:order-1 lg:border-r" : "lg:border-l"}`}>
            <div aria-hidden className={`absolute -right-24 -top-24 h-72 w-72 rounded-full blur-[90px] ${i % 2 ? "bg-[#ff5fb0]/20" : "bg-[#7c5cff]/20"}`} />
            <Reveal className="relative"><AppWindow><ProductMock k={r.k} /></AppWindow></Reveal>
          </div>
        </div>
      ))}
    </div>
  );
}

/** A bento card: title and copy on a quiet surface, the picture cropped at the bottom edge. */
export function BentoCard({ title, body, k, href, className = "" }: { title: string; body: string; k?: MockKey; href?: string; className?: string }) {
  const inner = (
    <>
      <div className="p-7 pb-0">
        <p className="flex items-center justify-between gap-3 text-[19px] font-semibold tracking-[-0.02em] text-ink">{title}{href && <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}</p>
        <p className="mt-2 max-w-[520px] text-[15px] leading-6 text-ink-soft">{body}</p>
      </div>
      {k && (
        <div aria-hidden className="relative mt-6 h-[230px] overflow-hidden pl-7">
          <div className="w-[640px] origin-top-left scale-[0.78] rounded-tl-2xl border-l border-t border-line bg-white shadow-[0_20px_50px_-30px_rgb(10_17_40_/_0.35)]"><ProductMock k={k} /></div>
        </div>
      )}
    </>
  );
  const cls = `surface group flex flex-col ${className}`;
  return href ? <Link href={href} className={`${cls} transition-shadow hover:shadow-[0_24px_60px_-34px_rgb(60_50_200_/_0.4)]`}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

/** The dark band: black panel, aurora at its foot, hairline cells with mono labels. */
export function DarkPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className="px-3 py-6 sm:px-5">
      <div className={`panel-dark mx-auto max-w-[1400px] px-5 py-20 sm:py-28 ${className}`}>
        <div className="relative z-10 mx-auto max-w-[1240px]">{children}</div>
      </div>
    </section>
  );
}

export function DarkCell({ label, body, children }: { label: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-[300px] flex-col p-6 sm:p-7">
      <p className={`${MONO_LABEL} text-white`}>{label}</p>
      <p className="mt-2 max-w-[320px] text-[14.5px] leading-6 text-white/55">{body}</p>
      <div className="mt-auto pt-8">{children}</div>
    </div>
  );
}

/** Workspace-level security, honest by construction (no certifications claimed). */
export function TrustStrip() {
  const items = capabilitiesIn("Workspace").filter((c) => !c.product);
  return (
    <ul className="hair-open grid-cols-2 lg:grid-cols-6">
      {items.map((c) => {
        const Icon = c.icon;
        return (
          <li key={c.label} className="flex flex-col items-start gap-6 p-5">
            <Icon className="h-6 w-6 text-ink" strokeWidth={1.6} />
            <span className={`${MONO_LABEL} leading-5 text-muted`}>{c.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
