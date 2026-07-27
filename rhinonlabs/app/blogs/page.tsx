import { getBlogs } from "@/lib/api";
import SearchableBlogs from "@/components/Pages/Blogs/SearchableBlogs";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blogs & Insights",
  description: "Deep dives into MVP development, AI engineering, and growth strategies for modern founders.",
};

export default async function BlogsPage() {
  const blogs = await getBlogs();

  return <SearchableBlogs initialBlogs={blogs} />;
}

