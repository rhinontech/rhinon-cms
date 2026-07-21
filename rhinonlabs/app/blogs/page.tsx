import { getBlogs } from "@/lib/api";
import SearchableBlogs from "@/components/Pages/Blogs/SearchableBlogs";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rhinonlabs.com";

export const metadata: Metadata = {
  title: "Blogs & Insights | Rhinon Labs",
  description:
    "Deep dives into MVP development, AI engineering, internal tools, and rapid growth strategies for modern founders.",
  alternates: {
    canonical: `${SITE_URL}/blogs`,
  },
  openGraph: {
    title: "Blogs & Insights | Rhinon Labs",
    description:
      "Deep dives into MVP development, AI engineering, internal tools, and rapid growth strategies for modern founders.",
    url: `${SITE_URL}/blogs`,
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Rhinon Labs Blogs & Insights",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blogs & Insights | Rhinon Labs",
    description:
      "Deep dives into MVP development, AI engineering, internal tools, and rapid growth strategies for modern founders.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

export default async function BlogsPage() {
  const blogs = await getBlogs();

  return <SearchableBlogs initialBlogs={blogs} />;
}
