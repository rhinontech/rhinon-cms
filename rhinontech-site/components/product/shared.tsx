import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { bySlug } from "@/content/products";
import { IconTile, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { Faq } from "@/components/blocks";
import { Cover } from "@/components/blog/parts";
import { JsonLd, breadcrumbNode, faqNode, graphJsonLd, moduleSoftwareAppNode } from "@/components/schema";
import { formatDate, getBlogs, matchBlogsForProduct } from "@/lib/blog";

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

/** Dynamically matched blog guides for a product module (hidden when no relevant posts match yet). */
export async function ProductGuides({ slug, dark = false }: { slug: string; dark?: boolean }) {
  const product = bySlug(slug);
  if (!product) return null;

  let posts = [] as Awaited<ReturnType<typeof getBlogs>>;
  try {
    posts = await getBlogs();
  } catch (err) {
    // Re-throw in production so Next.js ISR keeps the last good cached response.
    if (process.env.NODE_ENV === "production") throw err;
    return null;
  }

  const guides = matchBlogsForProduct(product, posts, 3);
  if (guides.length === 0) return null;

  return (
    <section className={dark ? "border-b border-white/10 bg-[#030306] py-20 text-white" : "border-b border-line py-20"}>
      <div className="mx-auto max-w-[1240px] px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <p className={`font-mono text-[11px] uppercase tracking-[0.2em] ${dark ? "text-white/45" : "text-muted"}`}>Guides</p>
            <h2 className={`font-display mt-3 text-[28px] font-semibold leading-[1.1] sm:text-[36px] ${dark ? "text-white" : "text-ink"}`}>
              Guides for {product.name}
            </h2>
          </Reveal>
          <Link
            href="/blog"
            className={`inline-flex items-center gap-1.5 text-[14px] font-medium transition-colors ${dark ? "text-white/65 hover:text-white" : "text-ink-soft hover:text-ink"}`}
          >
            All guides <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className={`group flex flex-col rounded-3xl border p-3 transition-colors ${
                dark ? "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]" : "border-line bg-white hover:bg-soft/70"
              }`}
            >
              <div className={`aspect-[16/10] overflow-hidden rounded-2xl border ${dark ? "border-white/10 bg-white/5" : "border-line bg-soft"}`}>
                <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]">
                  <Cover post={post} />
                </div>
              </div>
              <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
                {post.category && (
                  <span className={`font-mono text-[10.5px] uppercase tracking-[0.2em] ${dark ? "text-aurora-soft" : "text-aurora"}`}>
                    {post.category}
                  </span>
                )}
                <h3 className={`font-display mt-2 text-[20px] font-semibold leading-[1.2] ${dark ? "text-white" : "text-ink"}`}>
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className={`mt-2 line-clamp-2 text-[14px] leading-6 ${dark ? "text-white/60" : "text-ink-soft"}`}>
                    {post.excerpt}
                  </p>
                )}
                <div className={`mt-auto flex items-center justify-between pt-5 text-[12.5px] ${dark ? "text-white/50" : "text-muted"}`}>
                  <span>{formatDate(post.publishedAt)}</span>
                  {post.readTime && <span>{post.readTime}</span>}
                </div>
              </div>
            </Link>
          ))}
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
    <>
      {product && <ProductGuides slug={product.slug} dark={dark} />}
      <section className={dark ? "bg-[#030306] pb-24 pt-24 sm:pt-28" : "mx-auto max-w-[1240px] px-5 py-24 sm:py-28"}>
        <div className={dark ? "mx-auto max-w-[1240px] px-5" : ""}>
          <Reveal><SectionHead dark={dark} eyebrow="FAQ" title={title} /></Reveal>
          <div className="mt-14"><Faq items={items} dark={dark} /></div>
        </div>
        <JsonLd data={graphJsonLd(nodes)} />
      </section>
    </>
  );
}
