"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { BlogPost, blogCategories } from "./blogData";
import BlogPoster from "./BlogPoster";

export function BlogExplorer({ posts = [] }: { posts?: BlogPost[] }) {
  const [activeCategory, setActiveCategory] = useState("All Articles");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  // Derive dynamic categories list from existing posts, ensuring "All Articles" is first
  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });

    // If we have custom categories from the database, use them
    if (set.size > 0) {
      return ["All Articles", ...Array.from(set)];
    }
    return blogCategories;
  }, [posts]);

  const visiblePosts = useMemo(() => {
    const filtered =
      activeCategory === "All Articles"
        ? [...posts]
        : posts.filter((post) => post.category === activeCategory);

    return filtered.sort((a, b) =>
      sort === "newest"
        ? (b.dateISO || "").localeCompare(a.dateISO || "")
        : (a.dateISO || "").localeCompare(b.dateISO || "")
    );
  }, [posts, activeCategory, sort]);

  const countFor = (category: string) =>
    category === "All Articles"
      ? posts.length
      : posts.filter((post) => post.category === category).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      {/* Categories Sidebar */}
      <aside className="lg:col-span-3 lg:sticky lg:top-24">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
          Categories
        </div>
        <div className="flex lg:flex-col flex-wrap gap-2">
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex items-center justify-between gap-3 text-left text-sm font-semibold px-4 py-2.5 rounded-full border transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-gray-900 text-white border-gray-900 shadow-md"
                    : "bg-white text-gray-600 border-gray-200/80 hover:border-gray-300 hover:text-gray-900"
                }`}
              >
                <span>{category}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? "bg-white/15 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {countFor(category)}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Posts Grid */}
      <div className="lg:col-span-9">
        {/* Sort Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm font-semibold text-gray-500">
            {visiblePosts.length} article{visiblePosts.length === 1 ? "" : "s"}
          </div>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
              className="appearance-none bg-white border border-gray-200/80 hover:border-gray-300 rounded-full pl-5 pr-10 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-black transition-all cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
              ▼
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {visiblePosts.length === 0 ? (
            <div className="sm:col-span-2 py-12 text-center text-gray-400 font-medium">
              No blogs available in this category.
            </div>
          ) : (
            visiblePosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col bg-white rounded-3xl border border-gray-200/80 hover:border-gray-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]">
                    <BlogPoster post={post} />
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-6">
                  <span className={`${post.chip} border text-[11px] font-semibold px-3 py-1 rounded-full self-start mb-4`}>
                    {post.category}
                  </span>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight leading-snug mb-2.5">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-5">{post.excerpt}</p>

                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500">
                    <span>
                      {post.dateLabel} · {post.readTime}
                    </span>
                    <span className="text-sm font-bold text-gray-900 inline-flex items-center gap-1.5">
                      Read
                      <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default BlogExplorer;
