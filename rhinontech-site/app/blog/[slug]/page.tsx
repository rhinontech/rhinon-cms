import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { links, SITE_URL } from "@/components/site";
import { CtaBand } from "@/components/blocks";
import { getBlog, getBlogs, formatDate, toneFor, withHeadingIds, youtubeId, type BlogBlock } from "@/lib/blog";
import { Avatar, CategoryKicker, Cover, PostMeta } from "@/components/blog/parts";

export const revalidate = 300;
export const dynamicParams = true;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return (await getBlogs()).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const blog = await getBlog((await params).slug);
  if (!blog) return { title: "Article not found" };
  const title = blog.metaTitle || blog.title;
  const description = blog.metaDescription || blog.excerpt;
  return {
    title,
    description,
    alternates: { canonical: `/blog/${blog.slug}` },
    openGraph: { title, description, type: "article", url: `${SITE_URL}/blog/${blog.slug}`, publishedTime: blog.publishedAt, authors: [blog.authorName], ...(blog.coverImage ? { images: [{ url: blog.coverImage }] } : {}) },
    twitter: { card: "summary_large_image", title, description, ...(blog.coverImage ? { images: [blog.coverImage] } : {}) },
  };
}

function Block({ b, html }: { b: BlogBlock; html?: string }) {
  if (b.type === "paragraph") return <div dangerouslySetInnerHTML={{ __html: html ?? b.html }} />;
  if (b.type === "image")
    return (
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.url} alt={b.alt || ""} loading="lazy" />
        {b.credit && <figcaption>{b.credit}</figcaption>}
      </figure>
    );
  if (b.type === "video")
    return (
      <figure>
        <video src={b.url} controls preload="metadata" />
        {b.caption && <figcaption>{b.caption}</figcaption>}
      </figure>
    );
  const id = youtubeId(b.url);
  return id ? (
    <figure>
      <div className="aspect-video overflow-hidden rounded-2xl">
        <iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title={b.caption || "Video"} loading="lazy" allowFullScreen className="h-full w-full" />
      </div>
      {b.caption && <figcaption>{b.caption}</figcaption>}
    </figure>
  ) : null;
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [blog, all] = await Promise.all([getBlog(slug), getBlogs()]);
  if (!blog) notFound();

  // Blocks are the current format; `content` is the older single-HTML body and is the fallback.
  const taken = new Set<string>();
  const blocks: BlogBlock[] = blog.contentBlocks?.length ? blog.contentBlocks : [{ id: "legacy", type: "paragraph", html: blog.content || "" }];
  const toc: { id: string; text: string; level: 2 | 3 }[] = [];
  const rendered = blocks.map((b) => {
    if (b.type !== "paragraph") return { b, html: undefined };
    const r = withHeadingIds(b.html, taken);
    toc.push(...r.toc);
    return { b, html: r.html };
  });

  const related = all.filter((p) => p.slug !== blog.slug && (blog.category ? p.category === blog.category : true)).slice(0, 3);
  const tone = toneFor(blog.category);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description: blog.excerpt,
    datePublished: blog.publishedAt,
    author: { "@type": "Person", name: blog.authorName },
    publisher: { "@type": "Organization", name: "Rhinon Tech", url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/blog/${blog.slug}`,
    ...(blog.coverImage ? { image: blog.coverImage } : {}),
  };
  const faqLd = blog.faqs?.length
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: blog.faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) }
    : null;

  return (
    <>
      <article>
        {/* Header: title and byline on the left, the cover on the right */}
        <header className="px-5 pb-14 pt-10 sm:pt-14">
          <div className="mx-auto grid max-w-[1240px] items-stretch gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="flex min-w-0 flex-col">
              <Link href="/blog" className="font-mono text-[14px] font-medium uppercase tracking-[0.12em] hover:underline" style={{ color: tone }}>{blog.category || "Blog"}</Link>
              <h1 className="font-display mt-5 text-[38px] font-semibold leading-[1.04] sm:text-[56px]">{blog.title}</h1>
              <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3">
                <Avatar name={blog.authorName} src={blog.authorAvatar} size={48} />
                <div className="text-[15px] leading-5"><span className="font-semibold text-ink">{blog.authorName}</span> <span className="text-muted">{blog.authorRole}</span></div>
                <span aria-hidden className="hidden h-5 w-px bg-line sm:block" />
                <span className="text-[15px] text-muted">{formatDate(blog.publishedAt)} · {blog.readTime}</span>
              </div>
              <p className="mt-6 max-w-[560px] text-[17px] leading-8 text-ink-soft">{blog.excerpt}</p>
              <a href={links.signup} className="mt-8 flex h-[60px] items-center justify-center rounded-2xl bg-[#1c1c1f] text-[18px] font-semibold text-white transition hover:bg-black lg:mt-auto">Try Rhinon Tech free</a>
            </div>
            <div className="aspect-[16/11] overflow-hidden rounded-3xl border border-line bg-soft shadow-[0_30px_70px_-40px_rgb(70_60_200_/_0.5)] lg:aspect-auto lg:min-h-[420px]">
              <Cover post={blog} />
            </div>
          </div>
        </header>

        <div className="border-t border-line px-5 pb-16 pt-14">
          <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">
              <div className="prose-blog max-w-[760px]">
                {rendered.map(({ b, html }) => <Block key={b.id} b={b} html={html} />)}
              </div>

              {blog.faqs?.length > 0 && (
                <section className="mt-16 max-w-[760px]">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">FAQ</p>
                  <h2 className="font-display mt-3 text-[32px] font-semibold leading-[1.1]">Frequently asked questions</h2>
                  <div className="mt-6 divide-y divide-line rounded-2xl border border-line">
                    {blog.faqs.map((f) => (
                      <details key={f.question} className="group px-5 py-4">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16.5px] font-semibold text-ink">
                          {f.question}
                          <span className="text-[22px] font-light leading-none text-muted transition group-open:rotate-45">+</span>
                        </summary>
                        <p className="mt-3 text-[15.5px] leading-7 text-ink-soft">{f.answer}</p>
                      </details>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {toc.length > 0 && (
                <details open className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 font-mono text-[14px] font-medium uppercase tracking-[0.12em] text-violet">
                    Table of contents <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                  </summary>
                  <nav aria-label="Table of contents" className="mt-4 max-h-[42vh] overflow-y-auto pr-2">
                    <ul className="space-y-2.5 text-[14.5px] leading-5">
                      {toc.map((t) => (
                        <li key={t.id} className={t.level === 3 ? "pl-4" : ""}>
                          <a href={`#${t.id}`} className="text-ink-soft transition hover:text-ink">{t.text}</a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </details>
              )}
              <div className="rounded-3xl bg-[#1c1c1f] p-7 text-white">
                <p className="font-display text-[26px] font-semibold leading-[1.15]">Start using Rhinon Tech today</p>
                <ul className="mt-5 space-y-3 text-[16px] text-white/80">
                  {["Run your whole company in one place", "Collaborate with your team", "Use Rhinon Tech free, forever"].map((t) => (
                    <li key={t} className="flex items-center gap-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[#1c1c1f]"><Check className="h-3 w-3" strokeWidth={3.5} /></span>{t}</li>
                  ))}
                </ul>
                <a href={links.signup} className="mt-7 flex h-14 items-center justify-center rounded-2xl text-[18px] font-semibold text-white transition hover:brightness-110" style={{ background: "linear-gradient(90deg,#3d6bff,#7c5cff 55%,#ff8a5c)" }}>Get Started</a>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-line px-5 py-20">
          <div className="mx-auto max-w-[1240px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Keep reading</p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {related.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="group block rounded-3xl p-2.5 transition-colors hover:bg-soft/70">
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-soft"><Cover post={p} /></div>
                  <div className="px-2 pt-4">
                    <CategoryKicker category={p.category} />
                    <h3 className="font-display mt-2 text-[20px] font-semibold leading-[1.2] text-ink">{p.title}</h3>
                    <div className="mt-4"><PostMeta post={p} /></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBand title={<>Run your whole company from <span className="text-aurora-soft">one tab.</span></>} sub="Set up your workspace in a few minutes and bring your whole team. No credit card, no time limit." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "See all products", href: "/product" }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
    </>
  );
}
