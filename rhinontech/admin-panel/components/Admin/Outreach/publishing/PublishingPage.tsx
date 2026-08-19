"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TbBrandLinkedin, TbPlus, TbTrash } from "react-icons/tb";
import { toast } from "sonner";
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

export function PublishingPage() {
  const pathname = usePathname();
  const router = useRouter();
  const confirm = useConfirm();
  const [posts, setPosts] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [linkedinStatus, setLinkedinStatus] = useState<LinkedInStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);

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

  const published = posts.filter((p) => p.platformPostId);
  const drafts = posts.filter((p) => !p.platformPostId);

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-r-xl max-sm:rounded-xl glass-panel">
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <SubNavToggle />
          <div>
            <h1 className="text-base font-semibold tracking-tight text-gray-900">LinkedIn Publishing</h1>
            <p className="text-xs text-gray-500">Draft with AI, publish to LinkedIn, track engagement.</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setComposerOpen(true)}>
          <TbPlus size={15} /> New Post
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">
        <LinkedInConnectCard status={linkedinStatus} onStatusChange={setLinkedinStatus} />

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
            description="Create a post, video, or article — draft the content with AI, then publish when it's ready."
            action={
              <Button size="sm" onClick={() => setComposerOpen(true)}>
                <TbPlus size={15} /> New Post
              </Button>
            }
          />
        ) : (
          <>
            {drafts.length > 0 && (
              <PostGrid title="Drafts" posts={drafts} pathname={pathname} onDelete={handleDelete} />
            )}
            {published.length > 0 && (
              <PostGrid title="Published" posts={published} pathname={pathname} onDelete={handleDelete} />
            )}
          </>
        )}
      </div>

      <PublishComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        templates={templates}
        onCreated={(campaign) => router.push(`${pathname}/${campaign.id}`)}
      />
    </main>
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
      <p className="text-xs font-bold uppercase tracking-widest text-stone-400">{title}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <div key={post.id} className="group relative flex flex-col overflow-hidden rounded-xl glass-panel transition-shadow hover:shadow-md">
            <Link href={`${pathname}/${post.id}`} className="flex flex-1 flex-col">
              {post.mediaUrl ? (
                <div className="h-28 w-full overflow-hidden bg-stone-100">
                  <img src={post.mediaUrl} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-28 w-full items-center justify-center bg-stone-50 text-stone-200">
                  <ChannelIcon channel={post.channel} size={32} />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-1.5 p-4">
                <p className="truncate text-sm font-bold text-stone-900 group-hover:underline">{post.name}</p>
                <p className="flex items-center gap-1.5 text-xs text-stone-500">
                  <ChannelIcon channel={post.channel} size={13} />
                  {post.channel.replace("LinkedIn ", "")}
                  {post.platformPostId ? (
                    <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                    </span>
                  ) : (
                    <span className="ml-auto text-[10px] font-bold uppercase text-amber-600">Draft</span>
                  )}
                </p>
                {post.aiDraft && <p className="line-clamp-2 text-xs text-stone-400">{post.aiDraft}</p>}
                {post.platformPostId && post.socialStats && (
                  <p className="mt-auto pt-1 text-[11px] text-stone-400 tabular-nums">
                    {post.socialStats.likes} likes · {post.socialStats.comments} comments · {post.socialStats.impressions} impressions
                  </p>
                )}
              </div>
            </Link>
            <button
              onClick={() => onDelete(post)}
              className="absolute right-2 top-2 rounded-lg bg-white/80 p-1.5 text-stone-400 opacity-0 shadow transition-opacity hover:text-red-600 group-hover:opacity-100"
            >
              <TbTrash size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
