import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import { getBlogs, type Blog } from "@/lib/api";
import {
  getDynamicCategories,
  findCategoryBySlug,
  getCategorySlugForBlog,
} from "@/lib/blog-categories";
import { SCHEMA_IDS } from "@/lib/site";

export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.rhinonlabs.com";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const blogs = await getBlogs().catch(() => []);
  const categories = getDynamicCategories(blogs);
  return categories.map((cat) => ({
    slug: cat.slug,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const blogs = await getBlogs().catch(() => []);
  const category = findCategoryBySlug(blogs, slug);

  if (!category) {
    return { title: "Category Not Found" };
  }

  const title = `${category.name} Guides & Articles | Rhinon Labs`;
  const description = category.description;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/blogs/category/${category.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/blogs/category/${category.slug}`,
      type: "website",
      images: [
        {
          url: `${SITE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/og-image.jpg`],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const allBlogs = await getBlogs().catch(() => []);
  const category = findCategoryBySlug(allBlogs, slug);

  if (!category) {
    notFound();
  }

  const categories = getDynamicCategories(allBlogs);
  const matchingBlogs = allBlogs.filter(
    (blog) => getCategorySlugForBlog(blog) === category.slug
  );

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blogs` },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: `${SITE_URL}/blogs/category/${category.slug}`,
      },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/blogs/category/${category.slug}#webpage`,
    url: `${SITE_URL}/blogs/category/${category.slug}`,
    name: `${category.name} Guides & Articles`,
    description: category.description,
    isPartOf: { "@id": SCHEMA_IDS.website },
    about: { "@id": SCHEMA_IDS.organization },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: matchingBlogs.length,
      itemListElement: matchingBlogs.map((blog, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${SITE_URL}/blogs/${blog.slug}`,
        name: blog.title,
      })),
    },
  };

  return (
    <div className="relative flex flex-col selection:bg-[#1c2bff]/50 overflow-x-clip min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />

      {/* Header */}
      <section className="relative overflow-hidden pt-36 pb-12 px-6 max-w-[1200px] mx-auto w-full">
        <div className="mb-10">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to all articles
          </Link>
        </div>

        <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs font-semibold tracking-widest text-[#A3B8CC] uppercase font-sans">
            Category Hub
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white mb-4">
          {category.name}
        </h1>
        <p className="text-base sm:text-lg text-white/70 max-w-2xl leading-relaxed">
          {category.description}
        </p>

        {/* Dynamic Category Switcher Pills */}
        <div className="flex flex-wrap gap-2.5 mt-8 pt-6 border-t border-white/5">
          <Link
            href="/blogs"
            className="px-4 py-2 rounded-full text-xs font-medium border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            All Articles ({allBlogs.length})
          </Link>
          {categories.map((cat) => {
            const isActive = cat.slug === category.slug;
            return (
              <Link
                key={cat.slug}
                href={`/blogs/category/${cat.slug}`}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-colors border ${
                  isActive
                    ? "bg-white text-black font-semibold border-white"
                    : "border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat.name} ({cat.count})
              </Link>
            );
          })}
        </div>
      </section>

      {/* Articles Grid — Exact 3-column sizing and card dimensions matching All Articles */}
      <section className="pb-32 px-6 max-w-[1200px] mx-auto w-full">
        {matchingBlogs.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
            <p className="text-white/60">No articles published in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchingBlogs.map((blog) => (
              <Link
                key={blog.slug}
                href={`/blogs/${blog.slug}`}
                className="group flex flex-col rounded-[16px] border border-border/7 bg-background/30 overflow-hidden shadow-[inset_0_2px_1px_rgba(207,231,255,0.1)] hover:border-white/20 transition-all duration-300"
              >
                <div className="aspect-[16/10] overflow-hidden relative bg-white/5">
                  <Image
                    src={
                      blog.coverImage ||
                      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop"
                    }
                    alt={blog.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                    loading="lazy"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                    {category.name}
                  </span>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white/80 transition-colors leading-tight">
                    {blog.title}
                  </h3>
                  <p className="text-sm text-white/50 line-clamp-2 mb-4 leading-relaxed">
                    {blog.excerpt}
                  </p>

                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Image
                        src={blog.authorAvatar || "https://github.com/prabhatpk.png"}
                        alt={blog.authorName}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full border border-white/10 object-cover"
                      />
                      <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                        {blog.authorName}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/60">
                      {blog.publishedAt ? format(new Date(blog.publishedAt), "MMM d, yyyy") : blog.readTime}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
