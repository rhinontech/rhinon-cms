import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen } from "lucide-react";
import type { Blog } from "@/lib/api";

export function LatestGuides({ blogs }: { blogs?: Blog[] }) {
  if (!blogs || blogs.length === 0) return null;

  return (
    <section id="latest-guides" className="py-24 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 relative z-10 flex flex-col items-center">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="mb-6 inline-flex items-center px-4 py-1.5 rounded-full border border-white/10 bg-[#0F131C] backdrop-blur-md">
            <BookOpen className="w-3.5 h-3.5 text-primary mr-2" />
            <span className="text-[11px] font-semibold tracking-wider text-white/80 uppercase font-sans">
              INSIGHTS & GUIDES
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-transparent bg-clip-text bg-linear-to-b from-white to-white/60 mb-4">
            Latest Guides & <span className="font-serif italic text-transparent bg-clip-text">Playbooks</span>
          </h2>
          <p className="opacity-60 text-sm md:text-base max-w-xl">
            Practical strategies, cost breakdowns, and technical blueprints for building AI agents, automations, and scalable products.
          </p>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {blogs.slice(0, 3).map((blog, idx) => (
            <Link
              key={blog.id || blog.slug}
              href={`/blogs/${blog.slug}`}
              className="group flex flex-col rounded-2xl border border-white/10 bg-[#0B0F19] overflow-hidden hover:border-white/20 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:-translate-y-1 duration-300"
            >
              {blog.coverImage ? (
                <div className="relative aspect-16/10 w-full overflow-hidden bg-white/5">
                  <Image
                    src={blog.coverImage}
                    alt={blog.title}
                    fill
                    sizes="(min-width: 1024px) 380px, 100vw"
                    loading={idx < 2 ? "eager" : "lazy"}
                    priority={idx === 0}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="relative aspect-16/10 w-full bg-linear-to-br from-white/10 to-white/5 flex items-center justify-center p-6 text-white/40">
                  <BookOpen className="w-10 h-10" />
                </div>
              )}

              <div className="p-6 flex flex-col flex-1 justify-between">
                <div>
                  {blog.category && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#A3B8CC] mb-2 block">
                      {blog.category}
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white/80 transition-colors leading-snug line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-sm text-white/50 line-clamp-2 leading-relaxed mb-4">
                    {blog.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
                  <span>{blog.readTime || "5 min read"}</span>
                  <span className="inline-flex items-center gap-1 text-white group-hover:translate-x-1 transition-transform">
                    Read guide <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View all link */}
        <div className="mt-12 text-center">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
          >
            <span>Explore all 26 guides</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
