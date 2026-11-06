"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { BlogSummary } from "@/lib/blog";
import { CategoryKicker, Cover, PostMeta } from "@/components/blog/parts";
import { SubscribeForm } from "@/components/blog/SubscribeForm";

const PAGE = 9;

function Card({ post }: { post: BlogSummary }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block rounded-3xl p-2.5 transition-colors hover:bg-soft/70">
      <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-soft">
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"><Cover post={post} /></div>
      </div>
      <div className="px-2 pb-2 pt-4">
        <CategoryKicker category={post.category} />
        <h3 className="font-display mt-2 text-[21px] font-semibold leading-[1.2] text-ink">{post.title}</h3>
        <div className="mt-5"><PostMeta post={post} /></div>
      </div>
    </Link>
  );
}

function SubscribeCard() {
  return (
    <div className="flex flex-col rounded-3xl bg-[#1c1c1f] p-7 text-white md:col-span-1">
      <h3 className="font-display text-[26px] font-semibold leading-[1.1]">Subscribe to our blog</h3>
      <p className="mt-2 text-[14.5px] leading-6 text-white/55">Get the latest posts in your email.</p>
      <div className="mt-auto pt-24"><SubscribeForm tone="dark" /></div>
    </div>
  );
}

export function BlogIndex({ posts }: { posts: BlogSummary[] }) {
  const categories = useMemo(() => Array.from(new Set(posts.map((p) => p.category).filter(Boolean) as string[])), [posts]);
  const [cat, setCat] = useState<string>("All");
  const [shown, setShown] = useState(PAGE);

  const list = cat === "All" ? posts : posts.filter((p) => p.category === cat);
  const visible = list.slice(0, shown);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 border-b border-line pb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Articles</p>
        {categories.length > 0 && (
          <div className="ml-auto flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by topic">
            {["All", ...categories].map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={cat === c}
                onClick={() => { setCat(c); setShown(PAGE); }}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${cat === c ? "bg-[#1c1c1f] text-white" : "bg-soft text-ink-soft hover:text-ink"}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="py-20 text-center text-[16px] text-muted">No articles in this topic yet.</p>
      ) : (
        <div className="mt-8 grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((p, i) => (
            <div key={p.id} className="contents">
              {i === 5 && <SubscribeCard />}
              <Card post={p} />
            </div>
          ))}
        </div>
      )}

      {shown < list.length && (
        <div className="mt-14 flex justify-center">
          <button onClick={() => setShown((n) => n + PAGE)} className="inline-flex items-center gap-1.5 rounded-xl bg-soft px-6 py-3 text-[14.5px] font-semibold text-ink transition hover:bg-line">
            Load more <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
