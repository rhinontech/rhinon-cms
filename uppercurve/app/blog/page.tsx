import type { Metadata } from "next";
import BlogPage from "@/components/Pages/Blog/BlogPage";
import { getBlogs } from "@/services/blogService";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — UpperCurve",
  description:
    "Practical writing on AI, careers, building, and growth — from mentors and the UpperCurve community.",
};

export default async function Page() {
  const blogs = await getBlogs();
  return <BlogPage initialPosts={blogs} />;
}
