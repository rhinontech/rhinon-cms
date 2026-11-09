import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import type { BlogPost } from "@/components/Pages/Blog/blogData";
import type { Course } from "@/components/Pages/Courses/courseData";

export default function RelatedArticles({
  blogs,
  course,
}: {
  blogs?: BlogPost[];
  course?: Course;
}) {
  const hasBlogs = Boolean(blogs && blogs.length > 0);
  const hasCourse = Boolean(course);

  if (!hasBlogs && !hasCourse) return null;

  return (
    <section className="bg-white border-t border-[#EEF1F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-18">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#0052FF] mb-2">
              Deepen Your Understanding
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D]">
              Related Reading & Programs
            </h2>
          </div>
          {hasBlogs && (
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#0052FF] hover:text-[#0040D0] transition-colors"
            >
              View all articles <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {blogs?.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0052FF]/30 hover:bg-white hover:shadow-md transition-all flex flex-col"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-[#0052FF] mb-2.5">
                <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5" />
                  {article.category}
                </span>
                <span className="text-[#94A3B8]">{article.readTime}</span>
              </div>
              <h3 className="font-bold text-[16px] text-[#0B1B3D] group-hover:text-[#0052FF] transition-colors line-clamp-2 leading-snug">
                {article.title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#475569] line-clamp-2 leading-relaxed">
                {article.excerpt}
              </p>
              <span className="mt-auto pt-4 inline-flex items-center gap-1 text-xs font-bold text-[#0052FF]">
                Read article <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}

          {course && (
            <Link
              href={`/courses/${course.slug}`}
              className="group p-6 rounded-2xl bg-[#06102B] text-white hover:shadow-xl transition-all flex flex-col relative overflow-hidden border border-white/10"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-[#00C2FF]/20 text-[#7DD3FC]">
                  Live Cohort
                </span>
                <span className="text-xs text-white/50">{course.eyebrow || "6 Weeks"}</span>
              </div>
              <h3 className="font-bold text-[17px] text-white group-hover:text-[#7DD3FC] transition-colors leading-snug">
                {course.title} {course.titleAccent}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-white/70 line-clamp-2 leading-relaxed">
                {course.tagline || course.heroCard?.body || course.metaDescription}
              </p>
              <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#00C2FF]">
                Explore course <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
