"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TbAlertTriangle, TbBrandLinkedin, TbPlus, TbTrash } from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../shared/EmptyState";
import { ChannelIcon, isLinkedInChannel } from "../shared/ChannelIcon";
import { LinkedInConnectCard } from "./LinkedInConnectCard";
import { PublishComposer } from "./PublishComposer";
import type { Campaign, LinkedInStatus, Template } from "../shared/types";
import {
  MAX_OFFER_RATIO,
  offerRatio,
  OFFER_RATIO_WINDOW,
  POST_TYPE_LIST,
  POST_TYPE_META,
  POST_TYPES,
  type PostType,
} from "./postTypes";

export function PublishingPage() {
  const pathname = usePathname();
  const router = useRouter();
  const confirm = useConfirm();
  const [posts, setPosts] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [linkedinStatus, setLinkedinStatus] = useState<LinkedInStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<PostType | "ALL">("ALL");

  const fetchPosts = useCallback(async () => {
    try {
      const data = await apiFetch<Campaign[]>("/campaigns");
      setPosts(data.filter((c) => isLinkedInChannel(c.channel)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    apiFetch<Template[]>("/campaigns/templates").then(setTemplates).catch(() => { });
    apiFetch<LinkedInStatus>("/linkedin/status").then(setLinkedinStatus).catch(() => { });
  }, [fetchPosts]);

  const handleDelete = async (post: Campaign) => {
    const ok = await confirm({
      title: `Delete "${post.name}"?`,
      description: post.platformPostId
        ? "This only deletes the local record — the published LinkedIn post stays live."
        : "This draft will be permanently removed.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/campaigns/${post.id}`, { method: "DELETE" });
      toast.success("Deleted");
      fetchPosts();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  // Cadence is measured on what actually shipped — drafts don't reach anyone's feed.
  const cadence = useMemo(() => {
    const live = posts
      .filter((p) => p.platformPostId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const counts = Object.fromEntries(POST_TYPES.map((t) => [t, 0])) as Record<PostType, number>;
    for (const p of live) if (p.postType) counts[p.postType]++;

    const ratio = offerRatio(live.map((p) => p.postType));

    // Next up in the guide's rotation: Story → Framework → Contrarian → Case Study → Offer.
    const lastType = live.find((p) => p.postType)?.postType ?? null;
    const suggested: PostType = lastType
      ? POST_TYPES[(POST_TYPES.indexOf(lastType) + 1) % POST_TYPES.length]
      : "STORYTELLING";

    return { live, counts, ratio, suggested, total: live.length };
  }, [posts]);

  const visible = typeFilter === "ALL" ? posts : posts.filter((p) => p.postType === typeFilter);
  const published = visible.filter((p) => p.platformPostId);
  const drafts = visible.filter((p) => !p.platformPostId);

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-r-xl max-sm:rounded-xl glass-panel">
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <SubNavToggle />
          <div>
            <h1 className="text-base font-semibold tracking-tight text-foreground">LinkedIn Publishing</h1>
            <p className="text-xs text-muted-foreground">Five post types, one cadence. Draft with AI, publish, track.</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setComposerOpen(true)}>
          <TbPlus size={15} /> New Post
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">
        <LinkedInConnectCard status={linkedinStatus} onStatusChange={setLinkedinStatus} />

        {cadence.total > 0 && <CadenceCard cadence={cadence} onNew={() => setComposerOpen(true)} />}

        {posts.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterChip active={typeFilter === "ALL"} onClick={() => setTypeFilter("ALL")} label={`All (${posts.length})`} />
            {POST_TYPE_LIST.map((t) => {
              const n = posts.filter((p) => p.postType === t.id).length;
              if (!n) return null;
              return (
                <FilterChip
                  key={t.id}
                  active={typeFilter === t.id}
                  onClick={() => setTypeFilter(t.id)}
                  label={`${t.label} (${n})`}
                  dot={t.dot}
                />
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<TbBrandLinkedin size={44} />}
            title="No LinkedIn posts yet"
            description="Start with a Storytelling post — name a problem your buyer is living with, so they feel understood before you sell them anything."
            action={
              <Button size="sm" onClick={() => setComposerOpen(true)}>
                <TbPlus size={15} /> New Post
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<TbBrandLinkedin size={44} />}
            title="Nothing of that type yet"
            description="Clear the filter, or write one."
            action={
              <Button size="sm" variant="outline" onClick={() => setTypeFilter("ALL")}>
                Show all
              </Button>
            }
          />
        ) : (
          <>
            {drafts.length > 0 && <PostGrid title="Drafts" posts={drafts} pathname={pathname} onDelete={handleDelete} />}
            {published.length > 0 && <PostGrid title="Published" posts={published} pathname={pathname} onDelete={handleDelete} />}
          </>
        )}
      </div>

      <PublishComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        templates={templates}
        suggestedType={cadence.total > 0 ? cadence.suggested : null}
        onCreated={(campaign) => router.push(`${pathname}/${campaign.id}`)}
      />
    </main>
  );
}

/**
 * The mix. The guide's load-bearing rule is that Direct Offers are a minority of the
 * feed — the other four types are what earn the right to post one.
 */
function CadenceCard({
  cadence,
  onNew,
}: {
  cadence: { counts: Record<PostType, number>; ratio: ReturnType<typeof offerRatio>; suggested: PostType; total: number };
  onNew: () => void;
}) {
  const { counts, ratio, suggested, total } = cadence;
  const suggestedMeta = POST_TYPE_META[suggested];

  return (
    <div className="space-y-3 rounded-xl glass-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Published mix · {total} post{total === 1 ? "" : "s"}
        </p>
        <button onClick={onNew} className="text-[11px] font-semibold text-blue-600 dark:text-blue-300 hover:underline">
          Write a {suggestedMeta.label} next →
        </button>
      </div>

      {/* Mix bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {POST_TYPE_LIST.map((t) =>
          counts[t.id] ? (
            <div
              key={t.id}
              className={t.dot}
              style={{ width: `${(counts[t.id] / total) * 100}%` }}
              title={`${t.label}: ${counts[t.id]}`}
            />
          ) : null
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {POST_TYPE_LIST.map((t) => (
          <span key={t.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", counts[t.id] ? t.dot : "bg-muted-foreground/25")} />
            {t.label}
            <span className="font-semibold tabular-nums text-foreground">{counts[t.id]}</span>
          </span>
        ))}
      </div>

      {ratio.overweight && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200">
          <TbAlertTriangle size={14} className="mt-px shrink-0" />
          <span>
            {ratio.offers} of your last {ratio.total} posts were Direct Offers ({Math.round(ratio.ratio * 100)}%). The
            playbook puts the ceiling near {Math.round(MAX_OFFER_RATIO * 100)}% — the other four types are what earn the
            right to ask. Measured over the last {OFFER_RATIO_WINDOW} published posts.
          </span>
        </p>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, label, dot }: { active: boolean; onClick: () => void; label: string; dot?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
        active
          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />}
      {label}
    </button>
  );
}

function PostGrid({
  title,
  posts,
  pathname,
  onDelete,
}: {
  title: string;
  posts: Campaign[];
  pathname: string;
  onDelete: (post: Campaign) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => {
          const type = post.postType ? POST_TYPE_META[post.postType] : null;
          const needsInput = !post.platformPostId && (post.postMeta?.inputNeeded?.length ?? 0) > 0;
          return (
            <div key={post.id} className="group relative flex flex-col overflow-hidden rounded-xl glass-panel transition-shadow hover:shadow-md">
              <Link href={`${pathname}/${post.id}`} className="flex flex-1 flex-col">
                {post.mediaUrl ? (
                  <div className="h-28 w-full overflow-hidden bg-muted">
                    <img src={post.mediaUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-28 w-full items-center justify-center bg-muted/40 text-muted-foreground/50">
                    {type ? <type.icon size={32} /> : <ChannelIcon channel={post.channel} size={32} />}
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {type && (
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold", type.chip)}>
                        <type.icon size={10} /> {type.label}
                      </span>
                    )}
                    {post.platformPostId ? (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                      </span>
                    ) : (
                      <span className="ml-auto text-[10px] font-bold uppercase text-amber-600 dark:text-amber-300">Draft</span>
                    )}
                  </div>
                  <p className="truncate text-sm font-bold text-foreground group-hover:underline">{post.name}</p>
                  {post.aiDraft && <p className="line-clamp-2 text-xs text-muted-foreground">{post.aiDraft}</p>}
                  {needsInput && (
                    <p className="flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400">
                      <TbAlertTriangle size={11} /> {post.postMeta!.inputNeeded!.length} detail
                      {post.postMeta!.inputNeeded!.length === 1 ? "" : "s"} needed
                    </p>
                  )}
                  {post.platformPostId && post.socialStats && (
                    <p className="mt-auto pt-1 text-[11px] text-muted-foreground tabular-nums">
                      {post.socialStats.likes} likes · {post.socialStats.comments} comments · {post.socialStats.impressions} impressions
                    </p>
                  )}
                </div>
              </Link>
              <button
                onClick={() => onDelete(post)}
                className="absolute right-2 top-2 rounded-lg bg-card/80 p-1.5 text-muted-foreground opacity-0 shadow transition-opacity hover:text-red-600 dark:hover:text-red-300 group-hover:opacity-100"
              >
                <TbTrash size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
