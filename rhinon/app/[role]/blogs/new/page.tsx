"use client";

import { BlogEditor } from "@/views/Blogs/BlogEditor";

export default function NewBlogPage() {
  return (
    <div className="flex-1 bg-card/40 rounded-3xl border border-border overflow-hidden shadow-2xl">
      <BlogEditor />
    </div>
  );
}
