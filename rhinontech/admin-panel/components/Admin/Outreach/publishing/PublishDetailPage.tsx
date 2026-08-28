"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  TbArrowLeft,
  TbBrandLinkedin,
  TbCheck,
  TbExternalLink,
  TbLoader,
  TbPhoto,
  TbPhotoPlus,
  TbPhotoX,
  TbSparkles,
  TbTarget,
  TbTrash,
  TbX,
} from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChannelIcon, isLinkedInChannel } from "../shared/ChannelIcon";
import { PostStatsCard } from "./PostStatsCard";
import type { Campaign } from "../shared/types";

export function PublishDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const confirm = useConfirm();
  const roleSlug = pathname.split("/")[1];

  const [post, setPost] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [savingImage, setSavingImage] = useState(false);
  const [stats, setStats] = useState<Campaign["socialStats"] | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const data = await apiFetch<Campaign>(`/campaigns/${id}`);
      // Email campaigns live under Campaigns — bounce there.
      if (!isLinkedInChannel(data.channel)) {
        router.replace(`/${roleSlug}/outreach/campaigns/${id}`);
        return;
      }
      setPost(data);
      setDraft(data.aiDraft || "");
      if (data.socialStats) setStats(data.socialStats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, router, roleSlug]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const isLive = !!post?.platformPostId;
  const draftDirty = !!post && draft !== (post.aiDraft || "");

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await apiFetch(`/campaigns/${id}/process`, { method: "POST" });
      await fetchPost();
      toast.success("Draft generated");
    } catch (err: any) {
      toast.error("Generation failed: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await apiFetch(`/campaigns/${id}`, { method: "PUT", body: JSON.stringify({ aiDraft: draft }) });
      setPost((p) => (p ? { ...p, aiDraft: draft } : p));
      toast.success("Draft saved");
    } catch (err: any) {
      toast.error("Save failed: " + err.message);
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    if (draftDirty) {
      toast.info("Save your draft edits before publishing.");
      return;
    }
    const ok = await confirm({
      title: "Publish to LinkedIn now?",
      description: "The post goes live immediately on LinkedIn. This can't be unpublished from here.",
      confirmLabel: "Publish",
    });
    if (!ok) return;
    setPublishing(true);
    try {
      await apiFetch(`/campaigns/${id}/send`, { method: "POST" });
      await fetchPost();
      toast.success("Published to LinkedIn!");
    } catch (err: any) {
      toast.error("Publish failed: " + err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setGeneratingImage(true);
    try {
      const result = await apiFetch<{ url: string }>("/ai/images/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      setPreviewImageUrl(result.url);
    } catch (err: any) {
      toast.error("Image generation failed: " + err.message);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleAttachImage = async () => {
    if (!previewImageUrl) return;
    setSavingImage(true);
    try {
      await apiFetch(`/campaigns/${id}`, { method: "PUT", body: JSON.stringify({ mediaUrl: previewImageUrl }) });
      setPreviewImageUrl(null);
      setImagePrompt("");
      fetchPost();
    } catch (err: any) {
      toast.error("Failed to attach image: " + err.message);
    } finally {
      setSavingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    await apiFetch(`/campaigns/${id}`, { method: "PUT", body: JSON.stringify({ mediaUrl: null }) });
    fetchPost();
  };

  const handleFetchStats = async () => {
    setLoadingStats(true);
    try {
      const fresh = await apiFetch<Campaign["socialStats"]>(`/linkedin/campaigns/${id}/stats`);
      setStats(fresh);
    } catch (err: any) {
      toast.error("Failed to fetch stats: " + err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete this post?",
      description: isLive
        ? "This only deletes the local record — the published LinkedIn post stays live."
        : "This draft will be permanently removed.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/campaigns/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      router.push(`/${roleSlug}/outreach/publishing`);
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <TbLoader className="animate-spin text-muted-foreground/70" size={44} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <TbTarget size={64} className="mb-4 opacity-20" />
        <p>Post not found</p>
      </div>
    );
  }

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl glass-panel">
      {/* Header */}
      <div className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => router.push(`/${roleSlug}/outreach/publishing`)}
            className="-ml-2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <TbArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold tracking-tight text-foreground">{post.name}</h1>
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-400/25 bg-emerald-50 dark:bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-amber-200 dark:border-amber-400/25 bg-amber-50 dark:bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  Draft
                </span>
              )}
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ChannelIcon channel={post.channel} size={13} /> {post.channel}
              {post.organizationId ? " · Company page" : " · Personal profile"} · {post.visibility === "CONNECTIONS" ? "Connections" : "Public"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isLive && (
            <Button size="sm" onClick={handlePublish} disabled={publishing || !post.aiDraft}>
              {publishing ? <TbLoader className="animate-spin" size={15} /> : <TbBrandLinkedin size={15} />}
              Publish to LinkedIn
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <TbTrash size={15} />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-auto p-4">
        {/* Content */}
        <div className="space-y-3 rounded-xl glass-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Post Content</p>
            {!isLive && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generating}>
                  {generating ? <TbLoader className="animate-spin" size={14} /> : <TbSparkles size={14} />}
                  {post.aiDraft ? "Regenerate with AI" : "Generate with AI"}
                </Button>
                {draftDirty && (
                  <Button size="sm" onClick={handleSaveDraft} disabled={savingDraft}>
                    {savingDraft ? <TbLoader className="animate-spin" size={14} /> : <TbCheck size={14} />}
                    Save
                  </Button>
                )}
              </div>
            )}
          </div>
          {isLive ? (
            <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground/85">
              {post.aiDraft}
            </p>
          ) : (
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder='Write your post, or click "Generate with AI"...'
              className="min-h-48 resize-y text-sm leading-relaxed"
            />
          )}
          {post.articleUrl && (
            <a
              href={post.articleUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-300 hover:underline"
            >
              Linked article <TbExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Image */}
        <div className="space-y-3 rounded-xl glass-panel p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Post Image</p>
          {post.mediaUrl ? (
            <div className="group relative w-fit">
              <img src={post.mediaUrl} alt="Post media" className="max-h-56 rounded-lg object-cover" />
              {!isLive && (
                <button
                  onClick={handleRemoveImage}
                  className="absolute right-2 top-2 rounded-lg border border-border bg-card p-1.5 text-red-500 dark:text-red-400 opacity-0 shadow transition-opacity hover:bg-red-50 dark:hover:bg-red-400/10 group-hover:opacity-100"
                >
                  <TbPhotoX size={14} />
                </button>
              )}
            </div>
          ) : isLive ? (
            <p className="text-xs text-muted-foreground">No image was attached.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the image to generate..."
                  onKeyDown={(e) => e.key === "Enter" && handleGenerateImage()}
                />
                <Button size="sm" onClick={handleGenerateImage} disabled={generatingImage || !imagePrompt.trim()} className="shrink-0">
                  {generatingImage ? <TbLoader className="animate-spin" size={13} /> : <TbPhotoPlus size={13} />}
                  Generate
                </Button>
              </div>
              {previewImageUrl ? (
                <div className="space-y-2">
                  <img src={previewImageUrl} alt="Generated preview" className="max-h-56 rounded-lg object-cover" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAttachImage} disabled={savingImage}>
                      {savingImage ? <TbLoader className="animate-spin" size={13} /> : <TbCheck size={13} />}
                      Attach to Post
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPreviewImageUrl(null)}>
                      <TbX size={13} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-6">
                  <div className="text-center text-muted-foreground/70">
                    <TbPhoto size={28} className="mx-auto mb-1" />
                    <p className="text-[10px]">Optional image for your post</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats (published only) */}
        {isLive && (
          <>
            <PostStatsCard stats={stats ?? null} loading={loadingStats} onRefresh={handleFetchStats} />
            <p className="font-mono text-[10px] text-muted-foreground">Post ID: {post.platformPostId}</p>
          </>
        )}
      </div>
    </main>
  );
}
