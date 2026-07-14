import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getBlog } from "@/lib/api";
import { format } from "date-fns";
import { ArrowLeft, Clock, Share2, Sparkles, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/Common/Markdown/MarkdownRenderer";
import { BlockRenderer } from "@/components/Common/Blog/BlockRenderer";
import { TableOfContents } from "@/components/Common/Blog/TableOfContents";
import { BlogFaq } from "@/components/Common/Blog/BlogFaq";
import { extractToc } from "@/components/Common/Blog/blocks";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rhinonlabs.com";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) return { title: "Blog Not Found" };

  return {
    // metaTitle is used verbatim (absolute); otherwise the root "%s | Rhinon Labs" template applies.
    title: blog.metaTitle ? { absolute: blog.metaTitle } : blog.title,
    description: blog.metaDescription || blog.excerpt,
    alternates: { canonical: `${SITE_URL}/blogs/${blog.slug}` },
    openGraph: {
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription || blog.excerpt,
      images: blog.coverImage ? [blog.coverImage] : [],
    },
  };
}

export default async function BlogDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) {
    notFound();
  }

  const blocks = blog.contentBlocks?.length ? blog.contentBlocks : null;
  const toc = blocks ? extractToc(blocks) : [];
  const faqs = (blog.faqs || []).filter((f) => f.question?.trim() && f.answer?.trim());

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.metaDescription || blog.excerpt,
    ...(blog.coverImage ? { image: [blog.coverImage] } : {}),
    datePublished: blog.publishedAt,
    author: {
      "@type": "Person",
      name: blog.authorName,
      jobTitle: blog.authorRole,
    },
    publisher: {
      "@type": "Organization",
      name: "Rhinon Labs",
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blogs/${blog.slug}`,
    },
  };

  const faqSchema =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }
      : null;

  return (
    <div className="relative min-h-screen bg-background selection:bg-cyan-500/30 overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] right-[0%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[150px] animate-pulse" />
        <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
      </div>

      <div className={`${blocks ? "max-w-6xl" : "max-w-4xl"} mx-auto px-6 pt-32 pb-24 relative`}>
        <div className="max-w-4xl mx-auto">
          {/* Navigation */}
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-cyan-400 transition-colors mb-16 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Journal
          </Link>

          {/* Article Header */}
          <div className="space-y-10 mb-20">
            <div className="flex items-center gap-4">
              <div className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
                  {blog.category || "Exclusive Insight"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-[0.15em]">
                <Clock size={14} /> {blog.readTime}
              </div>
            </div>

            <h1 className="text-4xl md:text-7xl font-black text-foreground leading-[1.05] tracking-tight">
              {blog.title}
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium">
              {blog.excerpt}
            </p>

            <div className="flex flex-wrap items-center gap-8 pt-10 border-t border-border/50">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[2px] shadow-glow-sm">
                  <div className="h-full w-full rounded-[14px] bg-background flex items-center justify-center overflow-hidden">
                    <img src={blog.authorAvatar || "https://github.com/prabhatpk.png"} alt={blog.authorName} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-black text-foreground uppercase tracking-widest leading-none mb-1.5">{blog.authorName}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{blog.authorRole}</p>
                </div>
              </div>

              <div className="flex items-center gap-8 ml-auto">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Published</p>
                  <p className="text-xs font-bold text-foreground">{format(new Date(blog.publishedAt), "MMMM d, yyyy")}</p>
                </div>
                <button className="h-12 w-12 rounded-2xl bg-secondary border border-border flex items-center justify-center text-foreground hover:bg-cyan-500 hover:text-black transition-all group shadow-sm">
                  <Share2 size={20} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Feature Image */}
          {blog.coverImage && (
            <div className="w-full aspect-video rounded-[40px] overflow-hidden border border-white/5 shadow-2xl mb-24 relative group">
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
            </div>
          )}
        </div>

        {/* Content Body */}
        {blocks ? (
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16">
            <div className="min-w-0 max-w-3xl mx-auto lg:mx-0">
              <TableOfContents items={toc} variant="mobile" />
              <BlockRenderer blocks={blocks} />

              {/* Social Tags */}
              {blog.tags?.length > 0 && (
                <div className="mt-20 flex flex-wrap gap-3">
                  {blog.tags.map((tag: string) => (
                    <span key={tag} className="px-4 py-2 rounded-xl bg-secondary/50 border border-border text-xs font-bold text-muted-foreground hover:border-cyan-500/30 transition-colors cursor-default">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {faqs.length > 0 && <BlogFaq faqs={faqs} />}

              <NewsletterCta />
            </div>

            <aside className="hidden lg:block">
              <TableOfContents items={toc} />
            </aside>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -left-12 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-blue-500/20 to-transparent hidden lg:block" />

            <div className="prose prose-invert max-w-none">
              <MarkdownRenderer content={blog.content} />
            </div>

            {/* Social Tags */}
            <div className="mt-20 flex flex-wrap gap-3">
              {blog.tags?.map((tag: string) => (
                <span key={tag} className="px-4 py-2 rounded-xl bg-secondary/50 border border-border text-xs font-bold text-muted-foreground hover:border-cyan-500/30 transition-colors cursor-default">
                  #{tag}
                </span>
              ))}
            </div>

            {faqs.length > 0 && <BlogFaq faqs={faqs} />}

            <NewsletterCta />
          </div>
        )}
      </div>
    </div>
  );
}

function NewsletterCta() {
  return (
    <div className="mt-24 p-12 rounded-[32px] bg-secondary/20 border border-white/5 backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="absolute top-0 left-0 p-8 opacity-[0.03] pointer-events-none">
        <Sparkles size={200} className="text-cyan-500" />
      </div>

      <div className="space-y-4 text-center md:text-left">
        <div className="flex items-center gap-3 text-emerald-400 justify-center md:justify-start">
          <ShieldCheck size={20} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Authentic content</span>
        </div>
        <p className="text-xl font-black text-foreground">Stay ahead of the tech curve.</p>
      </div>

      <div className="flex gap-4">
        <button className="px-10 h-14 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-glow hover:translate-y-[-2px]">
          Join 5,000+ Founders
        </button>
      </div>
    </div>
  );
}
