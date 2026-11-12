import { toneFor, type BlogSummary } from "@/lib/blog";

/** The mono, coloured category label above a card or a headline. */
export function CategoryKicker({ category }: { category: string | null }) {
  const c = category || "Rhinon Tech";
  return <span className="font-mono text-[11.5px] font-medium uppercase tracking-[0.16em]" style={{ color: toneFor(c) }}>{c}</span>;
}

export function Avatar({ name, src, size = 32 }: { name: string; src?: string | null; size?: number }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-violet/12 font-semibold text-violet" style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials}</span>
  );
}

/** The post's own image, or a soft tinted tile in its category colour when it has none. */
export function Cover({ post, className = "" }: { post: Pick<BlogSummary, "coverImage" | "category" | "title">; className?: string }) {
  if (post.coverImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={post.coverImage} alt="" loading="lazy" className={`h-full w-full object-cover ${className}`} />;
  }
  const t = toneFor(post.category);
  return (
    <div className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`} style={{ background: `linear-gradient(135deg, ${t}26, ${t}0d 60%, #fff)` }}>
      <span aria-hidden className="absolute -right-8 -top-8 h-44 w-44 rounded-full blur-3xl" style={{ background: `${t}45` }} />
      <span aria-hidden className="absolute -bottom-10 -left-6 h-36 w-36 rounded-full blur-3xl" style={{ background: `${t}30` }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/mark-navy.png" alt="" aria-hidden className="relative h-16 w-16 opacity-90" />
    </div>
  );
}

export function PostMeta({ post }: { post: Pick<BlogSummary, "authorName" | "authorAvatar" | "readTime"> }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={post.authorName} src={post.authorAvatar} size={28} />
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">{post.authorName}</span>
      <span className="shrink-0 font-mono text-[11.5px] text-violet">{post.readTime}</span>
    </div>
  );
}
