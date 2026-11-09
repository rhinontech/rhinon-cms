import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogDetails from "@/components/Pages/Blog/BlogDetails/BlogDetails";
import { getBlogBySlug, getBlogs } from "@/services/blogService";
import JsonLd from "@/components/SEO/JsonLd";
import { buildBlogSchema } from "@/components/SEO/schema";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);

  if (!post) {
    return { title: "Article not found — UpperCurve" };
  }

  const title = post.metaTitle || `${post.title} — UpperCurve Blog`;
  const description = post.metaDescription || post.excerpt;

  return {
    title,
    description,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.dateISO,
      authors: post.authorName ? [post.authorName] : undefined,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, allPosts] = await Promise.all([
    getBlogBySlug(slug),
    getBlogs(),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <>
      <JsonLd schema={buildBlogSchema(post)} />
      <BlogDetails post={post} relatedPosts={allPosts} />
    </>
  );
}
