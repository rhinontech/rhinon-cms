"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BlogEditor } from "@/views/Blogs/BlogEditor";
import { Blog } from "@/lib/types";
import { toast } from "sonner";

export default function EditBlogPage() {
  const params = useParams();
  const id = params.id as string;
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`/api/blogs/${id}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setBlog(data);
      } catch (err: any) {
        toast.error("Failed to load blog post");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-muted-foreground font-medium">Blog post not found.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-card/40 rounded-3xl border border-border overflow-hidden shadow-2xl">
      <BlogEditor blog={blog} />
    </div>
  );
}
