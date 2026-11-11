import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { bySlug } from "@/content/products";
import { IconTile, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { Faq } from "@/components/blocks";
import { JsonLd, breadcrumbNode, faqNode, graphJsonLd, moduleSoftwareAppNode } from "@/components/schema";

/** "Product › Sell › CRM" above a product's headline. */
export function Crumb({ slug, dark = false, center = false }: { slug: string; dark?: boolean; center?: boolean }) {
  const p = bySlug(slug)!;
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-[13.5px] ${center ? "justify-center" : ""} ${dark ? "text-white/50" : "text-muted"}`}>
      <Link href="/product" className={dark ? "hover:text-white" : "hover:text-ink"}>Product</Link><ChevronRight className="h-3.5 w-3.5" />
      <span>{p.group}</span><ChevronRight className="h-3.5 w-3.5" />
      <span className={`font-medium ${dark ? "text-white" : "text-ink"}`}>{p.name}</span>
    </nav>
  );
}

/** A quiet row of links to the products this one works with. */
export function PairsWith({ items, dark = false }: { items: { slug: string; line: string }[]; dark?: boolean }) {
  return (
    <section className={dark ? "bg-[#030306] pb-24 pt-8" : "pb-24 pt-8"}>
      <div className="mx-auto max-w-[1240px] px-5">
        <p className={`font-mono text-[12px] uppercase tracking-[0.18em] ${dark ? "text-white/45" : "text-muted"}`}>Works with</p>
        <div className={`mt-4 grid divide-y rounded-3xl border md:grid-cols-3 md:divide-x md:divide-y-0 ${dark ? "divide-white/10 border-white/10" : "divide-line border-line"}`}>
          {items.map(({ slug, line }) => {
            const p = bySlug(slug)!;
            return (
              <Link key={slug} href={`/product/${slug}`} className={`group flex items-start gap-4 p-6 transition-colors first:rounded-t-3xl last:rounded-b-3xl md:first:rounded-l-3xl md:first:rounded-tr-none md:last:rounded-r-3xl md:last:rounded-bl-none ${dark ? "hover:bg-white/[0.04]" : "hover:bg-soft"}`}>
                <IconTile icon={p.icon} tone={p.tone} size={42} />
                <span className="min-w-0 flex-1">
                  <span className={`font-display block text-[20px] font-semibold ${dark ? "text-white" : "text-ink"}`}>{p.name}</span>
                  <span className={`mt-1 block text-[14.5px] leading-6 ${dark ? "text-white/60" : "text-ink-soft"}`}>{line}</span>
                </span>
                <ArrowUpRight className={`h-5 w-5 shrink-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${dark ? "text-white/40 group-hover:text-white" : "text-muted group-hover:text-ink"}`} />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** The FAQ block every product page ends with, plus its structured data. */
export function ProductFaq({ title, items, slug, dark = false }: { title: string; items: { q: string; a: string }[]; slug?: string; dark?: boolean }) {
  const product = slug ? bySlug(slug) : undefined;
  const nodes: Record<string, unknown>[] = product
    ? [
        moduleSoftwareAppNode(product.slug),
        breadcrumbNode([
          { name: "Home", path: "/" },
          { name: "Products", path: "/product" },
          { name: product.name, path: `/product/${product.slug}` },
        ]),
        faqNode(items),
      ]
    : [faqNode(items)];

  return (
    <section className={dark ? "bg-[#030306] pb-24 pt-24 sm:pt-28" : "mx-auto max-w-[1240px] px-5 py-24 sm:py-28"}>
      <div className={dark ? "mx-auto max-w-[1240px] px-5" : ""}>
        <Reveal><SectionHead dark={dark} eyebrow="FAQ" title={title} /></Reveal>
        <div className="mt-14"><Faq items={items} dark={dark} /></div>
      </div>
      <JsonLd data={graphJsonLd(nodes)} />
    </section>
  );
}
