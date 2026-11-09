import type { Metadata } from "next";
import BlogPage from "@/components/Pages/Blog/BlogPage";
import { getBlogs } from "@/services/blogService";
import JsonLd from "@/components/SEO/JsonLd";
import { buildBlogCollectionSchema } from "@/components/SEO/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Practical AI Guides & Insights for Aspiring Engineers | UpperCurve",
  description:
    "Learn how AI Agents really work and how to put them to use. Clear, Hands-On Articles on Agentic AI, Learning, Careers & building with AI.",
  alternates: {
    canonical: "/blog",
  },
};

export default async function Page() {
  const blogs = await getBlogs();
  return (
    <>
      <JsonLd schema={buildBlogCollectionSchema(blogs)} />
      <BlogPage initialPosts={blogs} />
    </>
  );
}
