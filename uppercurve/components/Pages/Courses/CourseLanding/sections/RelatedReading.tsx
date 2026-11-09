import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import type { BlogPost } from "@/components/Pages/Blog/blogData";

export default function RelatedReading({ blogs }: { blogs?: BlogPost[] }) {
  if (!blogs || blogs.length === 0) return null;

  return (
    <section className="bg-[#F8FAFC] border-t border-[#E8ECF3] py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#0052FF] mb-3">
              Deepen Your Knowledge
            </p>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0B1B3D] tracking-tight">
              Related Reading
            </h2>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#0052FF] hover:text-[#0040D0] transition-colors"
          >
            Browse all articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group flex flex-col p-6 rounded-2xl bg-white border border-[#E6EAF2] hover:border-[#0052FF]/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between text-xs text-[#0052FF] font-semibold mb-3">
                <span className="font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {article.category}
                </span>
                <span className="text-[#94A3B8]">{article.readTime}</span>
              </div>
              <h3 className="text-lg font-bold text-[#0B1B3D] group-hover:text-[#0052FF] transition-colors line-clamp-2 leading-snug">
                {article.title}
              </h3>
              <p className="mt-2 text-sm text-[#475569] leading-relaxed line-clamp-2">
                {article.excerpt}
              </p>
              <div className="mt-auto pt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#0052FF]">
                Read guide <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
