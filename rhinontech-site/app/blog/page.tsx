import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Aurora } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { LightSection } from "@/components/light";
import { getBlogs } from "@/lib/blog";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { CategoryKicker, Cover, PostMeta } from "@/components/blog/parts";
import { SubscribeForm } from "@/components/blog/SubscribeForm";

export const metadata: Metadata = {
  title: "Blog",
  description: "Ideas, guides and updates for teams that run their whole company in one workspace: sales, projects, people and AI.",
  alternates: { canonical: "/blog" },
};

export const revalidate = 300;

export default async function BlogPage() {
  const posts = await getBlogs();
  const [featured, ...rest] = posts;

  return (
    <>
      <section className="relative overflow-hidden px-5 pb-16 pt-14 sm:pt-20">
        <Aurora />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <h1 className="font-display text-[44px] font-semibold leading-[1.02] sm:text-[68px]">
              Ideas for teams that run on <span className="text-aurora">one workspace.</span>
            </h1>
            <p className="mt-6 max-w-[520px] text-[18px] leading-8 text-ink-soft">Guides, how-tos and product news on selling, delivering and running your team, with AI built in. Join the newsletter to get new posts in your email.</p>
            <SubscribeForm className="relative mt-8 max-w-[520px]" />
          </Reveal>

          <Reveal delay={120}>
            {featured ? (
              <Link href={`/blog/${featured.slug}`} className="group block">
                <div className="aspect-[16/10] overflow-hidden rounded-3xl border border-line bg-soft shadow-[0_30px_70px_-40px_rgb(70_60_200_/_0.5)]">
                  <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.02]"><Cover post={featured} /></div>
                </div>
                <div className="mt-4 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <CategoryKicker category={featured.category} />
                    <h2 className="font-display mt-1.5 text-[24px] font-semibold leading-[1.15] text-ink group-hover:underline group-hover:underline-offset-4">{featured.title}</h2>
                  </div>
                  <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-muted transition group-hover:text-ink" />
                </div>
                <div className="mt-4"><PostMeta post={featured} /></div>
              </Link>
            ) : (
              <div className="rounded-3xl border border-line bg-soft/60 p-10">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Coming soon</p>
                <p className="font-display mt-3 text-[28px] font-semibold leading-[1.1] text-ink">The first articles are on the way.</p>
                <p className="mt-3 text-[16px] leading-7 text-ink-soft">Subscribe and we will send you the first post the day it goes live.</p>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {rest.length > 0 && (
        <LightSection className="!pt-10 sm:!pt-14">
          <BlogIndex posts={rest} />
        </LightSection>
      )}

      <section className="px-5 pb-24 pt-6 sm:pb-32">
        <Reveal className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[32px] bg-soft p-8 sm:p-14">
          <div className="relative max-w-[560px]">
            <h2 className="font-display text-[34px] font-semibold leading-[1.05] sm:text-[48px]">Get the latest posts in your email.</h2>
            <SubscribeForm className="relative mt-7" />
          </div>
        </Reveal>
      </section>
    </>
  );
}
