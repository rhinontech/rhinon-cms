"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { type Blog } from "@/lib/api";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import SchedulerModal from "@/components/Common/CTA/SchedulerModal";

interface SearchableBlogsProps {
  initialBlogs: Blog[];
}

const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function SearchableBlogs({ initialBlogs }: SearchableBlogsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

  // Filter all blogs based on search query
  const filteredAll = initialBlogs.filter((blog) => {
    const query = searchQuery.toLowerCase();
    return (
      blog.title.toLowerCase().includes(query) ||
      blog.excerpt.toLowerCase().includes(query) ||
      (blog.category && blog.category.toLowerCase().includes(query)) ||
      blog.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  // Recent articles section will show the first 2 blogs when no search is active
  const recentBlogs = initialBlogs.slice(0, 2);

  // All articles section will show the rest of the blogs, or all search results if a search is active
  const displayedAllBlogs = searchQuery ? filteredAll : initialBlogs.slice(2);

  return (
    <main className="blog-theme min-h-screen bg-background relative selection:bg-primary/50 flex flex-col pt-32 pb-24 overflow-hidden">
      {/* Background Image with Mask matching Home Page theme */}
      <div className="absolute inset-0 top-64 max-sm:top-52 -z-10 opacity-30 pointer-events-none">
        <div className="mask-[linear-gradient(to_bottom,transparent,white_30%,white_60%,transparent)] mask-mode:luminance relative w-full h-full">
          <img
            src="/images/background/background.jpg"
            className="w-full h-full object-cover"
            alt="Background Grid Texture"
          />
        </div>
      </div>

      <div className="grow flex flex-col items-center">
        {/* Header Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="flex flex-col items-center text-center mb-16 px-6 max-w-3xl"
        >
          <motion.div
            variants={fadeUpVariant}
            className="mb-8 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium tracking-widest text-[#A3B8CC] uppercase font-sans">
              Rhinon Labs Insights
            </span>
          </motion.div>
          <motion.h1
            variants={fadeUpVariant}
            className="text-[42px] sm:text-5xl md:text-7xl font-sans font-normal leading-[1.1] tracking-[-0.02em] text-transparent bg-clip-text bg-linear-to-b from-white/90 to-white/50 mb-6 py-2"
          >
            The <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Founder's</span> Journal
          </motion.h1>
          <motion.p
            variants={fadeUpVariant}
            className="text-white/70 sm:text-lg max-w-2xl mx-auto mb-8 px-4"
          >
            Deep dives into MVP development, AI engineering, and growth strategies for modern founders.
          </motion.p>
          <motion.div variants={fadeUpVariant}>
            <Button
              onClick={() => setIsSchedulerOpen(true)}
              size="lg"
              className="rounded-2xl max-sm:py-5 px-8 bg-primary hover:bg-primary/90 text-white max-sm:text-sm font-medium"
            >
              Book a Free Discovery Call
            </Button>
          </motion.div>
        </motion.div>

        {/* Recent Articles Section (Only visible when no search query is active) */}
        {!searchQuery && recentBlogs.length > 0 && (
          <div className="w-full max-w-[1200px] mx-auto px-6 mb-20 relative z-10">
            <h2 className="text-2xl font-medium text-white mb-8 border-b border-white/5 pb-4">
              Recent Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {recentBlogs.map((blog) => (
                <Link
                  key={blog.id}
                  href={`/blogs/${blog.slug}`}
                  className="group flex flex-col rounded-[20px] border border-border/7 bg-background/50 backdrop-blur-md overflow-hidden shadow-[inset_0_2px_1px_rgba(207,231,255,0.15)] hover:border-white/20 transition-all duration-300"
                >
                  <div className="aspect-[21/9] overflow-hidden relative bg-white/5">
                    <img
                      src={blog.coverImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop"}
                      alt={blog.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />
                    {blog.category && (
                      <div className="absolute top-4 left-4">
                        <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/90">
                          {blog.category}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-4 text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">
                      <span>
                        {format(new Date(blog.publishedAt), "MMM d, yyyy")}
                      </span>
                      <div className="h-1 w-1 rounded-full bg-white/20" />
                      <span>{blog.readTime}</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-semibold text-white mb-2 group-hover:text-white/80 transition-colors leading-tight">
                      {blog.title}
                    </h3>
                    <p className="text-white/60 text-sm line-clamp-2 mb-4 leading-relaxed">
                      {blog.excerpt}
                    </p>

                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={blog.authorAvatar || "https://github.com/prabhatpk.png"}
                          alt={blog.authorName}
                          className="w-8 h-8 rounded-full border border-white/10 object-cover"
                        />
                        <div>
                          <p className="text-[10px] font-bold text-white uppercase tracking-wider">{blog.authorName}</p>
                          <p className="text-[9px] text-white/40 uppercase tracking-wider">{blog.authorRole || "Author"}</p>
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Articles Section */}
        <div className="w-full max-w-[1200px] mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-6">
            <h2 className="text-2xl font-medium text-white">
              {searchQuery ? `Search Results (${filteredAll.length})` : "All Articles"}
            </h2>

            {/* Search Input */}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors bg-white/5"
              />
            </div>
          </div>

          {displayedAllBlogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedAllBlogs.map((blog) => (
                <Link
                  key={blog.id}
                  href={`/blogs/${blog.slug}`}
                  className="group flex flex-col rounded-[16px] border border-border/7 bg-background/30 overflow-hidden shadow-[inset_0_2px_1px_rgba(207,231,255,0.1)] hover:border-white/20 transition-all duration-300"
                >
                  <div className="aspect-[16/10] overflow-hidden relative bg-white/5">
                    <img
                      src={blog.coverImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop"}
                      alt={blog.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    {blog.category && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/45 mb-2">
                        {blog.category}
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white/80 transition-colors leading-tight">
                      {blog.title}
                    </h3>
                    <p className="text-sm text-white/50 line-clamp-2 mb-4 leading-relaxed">{blog.excerpt}</p>

                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={blog.authorAvatar || "https://github.com/prabhatpk.png"}
                          alt={blog.authorName}
                          className="w-6 h-6 rounded-full border border-white/10 object-cover"
                        />
                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{blog.authorName}</span>
                      </div>
                      <span className="text-[10px] text-white/45">{format(new Date(blog.publishedAt), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
              <p className="text-white/45">No articles found matching "{searchQuery}".</p>
            </div>
          )}
        </div>
      </div>

      {/* Decorative Bottom Glow Elements matching the overall website design */}
      <div
        className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-[1200px] h-[4px] pointer-events-none"
        style={{
          background: "radial-gradient(50% 50% at 50% 50%, rgba(216, 231, 242, 0.07) 0%, rgba(216, 231, 242, 0) 100%)",
        }}
      />
      <div
        className="absolute -bottom-[249px] left-0 right-0 mx-auto w-[793px] h-[499px] opacity-10 pointer-events-none -rotate-13 rounded-[10px]"
        style={{
          background: "radial-gradient(50% 50% at 50% 50%, rgba(213, 219, 230, 0.7) 0%, rgba(213, 219, 230, 0) 100%)",
          zIndex: 1,
        }}
      />
      <SchedulerModal isOpen={isSchedulerOpen} onClose={() => setIsSchedulerOpen(false)} />
    </main>
  );
}
