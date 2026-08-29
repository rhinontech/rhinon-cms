"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  TbAlertTriangle,
  TbArrowLeft,
  TbBrandLinkedin,
  TbBulb,
  TbCheck,
  TbExternalLink,
  TbLoader,
  TbPhoto,
  TbPhotoPlus,
  TbPhotoX,
  TbSparkles,
  TbTarget,
  TbTrash,
  TbWand,
  TbX,
} from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChannelIcon, isLinkedInChannel } from "../shared/ChannelIcon";
import { PostStatsCard } from "./PostStatsCard";
import type { Campaign } from "../shared/types";
import { AUDIENCE_META, POST_AUDIENCES, POST_TYPE_LIST, POST_TYPE_META, type PostAudience, type PostType } from "./postTypes";

/** LinkedIn truncates the feed preview at roughly this many characters. */
const FOLD = 210;

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

  // Brief — editable, and re-sent on every generate so retyping a draft is one click.
  const [postType, setPostType] = useState<PostType | null>(null);
  const [postAudience, setPostAudience] = useState<PostAudience | "">("");
  const [topic, setTopic] = useState("");
  const [sourceFacts, setSourceFacts] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [savingBrief, setSavingBrief] = useState(false);

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
      setPostType(data.postType ?? null);
      setPostAudience(data.postAudience ?? "");
      setTopic(data.topic || "");
      setSourceFacts(data.sourceFacts || "");
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
  const briefDirty =
    !!post &&
    (postType !== (post.postType ?? null) ||
      (postAudience || null) !== (post.postAudience ?? null) ||
      topic !== (post.topic || "") ||
      sourceFacts !== (post.sourceFacts || ""));

  const typeMeta = postType ? POST_TYPE_META[postType] : null;
  const meta = post?.postMeta ?? null;
  const inputNeeded = meta?.inputNeeded ?? [];

  const { preview, folded } = useMemo(() => {
    const body = draft.trim();
    if (body.length <= FOLD) return { preview: body, folded: false };
    return { preview: body.slice(0, FOLD).trimEnd(), folded: true };
  }, [draft]);

  const handleGenerate = async () => {
    if (!postType) {
      toast.error("Pick a post type first.");
      return;
    }
    setGenerating(true);
    try {
      await apiFetch(`/campaigns/${id}/process`, {
        method: "POST",
        body: JSON.stringify({
          postType,
          postAudience: postAudience || null,
          topic: topic.trim() || null,
          sourceFacts: sourceFacts.trim() || null,
          customPrompt: customPrompt.trim() || null,
        }),
      });
      await fetchPost();
      setCustomPrompt("");
      toast.success(`${POST_TYPE_META[postType].label} draft generated`);
    } catch (err: any) {
      toast.error("Generation failed: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveBrief = async () => {
    setSavingBrief(true);
    try {
      await apiFetch(`/campaigns/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          postType,
          postAudience: postAudience || null,
          topic: topic.trim() || null,
          sourceFacts: sourceFacts.trim() || null,
        }),
      });
      await fetchPost();
      toast.success("Brief saved");
    } catch (err: any) {
      toast.error("Save failed: " + err.message);
    } finally {
      setSavingBrief(false);
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
      description: inputNeeded.length
        ? `This post still has ${inputNeeded.length} unverified detail${inputNeeded.length === 1 ? "" : "s"} flagged. Publishing goes live immediately and can't be unpublished from here.`
        : "The post goes live immediately on LinkedIn. This can't be unpublished from here.",
      confirmLabel: "Publish",
      destructive: inputNeeded.length > 0,
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
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-base font-semibold tracking-tight text-foreground">{post.name}</h1>
              {typeMeta && (
                <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", typeMeta.chip)}>
                  <typeMeta.icon size={12} /> {typeMeta.label}
                </span>
              )}
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
              {typeMeta && ` · ${typeMeta.objective}`}
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

      <div className="flex-1 overflow-auto p-4">
        {/* Unverified claims — the one thing that should block a publish. */}
        {!isLive && inputNeeded.length > 0 && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-400/25 dark:bg-red-400/10">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-300">
              <TbAlertTriangle size={14} /> Needs a real detail before publishing
            </p>
            <ul className="mt-2 space-y-1 text-xs text-red-800/90 dark:text-red-200/90">
              {inputNeeded.map((n, i) => (
                <li key={i} className="flex gap-2">
                  <span className="select-none">·</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-red-700/80 dark:text-red-300/80">
              Add these to Verified facts and regenerate — the AI won&apos;t invent them.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* Left column — brief, content, image */}
          <div className="space-y-4">
            {/* Brief */}
            {!isLive && (
              <div className="space-y-3 rounded-xl glass-panel p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Brief</p>
                  {briefDirty && (
                    <Button size="sm" variant="outline" onClick={handleSaveBrief} disabled={savingBrief}>
                      {savingBrief ? <TbLoader className="animate-spin" size={13} /> : <TbCheck size={13} />}
                      Save brief
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Post type</Label>
                    <Select value={postType ?? ""} onValueChange={(v) => setPostType(v as PostType)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pick a type" />
                      </SelectTrigger>
                      <SelectContent>
                        {POST_TYPE_LIST.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.n}. {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Audience</Label>
                    <Select value={postAudience || ""} onValueChange={(v) => setPostAudience(v as PostAudience)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pick an audience" />
                      </SelectTrigger>
                      <SelectContent>
                        {POST_AUDIENCES.map((a) => (
                          <SelectItem key={a} value={a}>
                            {AUDIENCE_META[a].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="brief-topic">Topic / angle</Label>
                  <Textarea
                    id="brief-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="What is this post about?"
                    className="min-h-16 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="brief-facts">Verified facts</Label>
                  <Textarea
                    id="brief-facts"
                    value={sourceFacts}
                    onChange={(e) => setSourceFacts(e.target.value)}
                    placeholder="Real clients, real numbers, real outcomes. The AI may not state anything that isn't here."
                    className="min-h-24 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="space-y-3 rounded-xl glass-panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Post Content</p>
                {!isLive && draftDirty && (
                  <Button size="sm" onClick={handleSaveDraft} disabled={savingDraft}>
                    {savingDraft ? <TbLoader className="animate-spin" size={14} /> : <TbCheck size={14} />}
                    Save
                  </Button>
                )}
              </div>

              {isLive ? (
                <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground/85">
                  {post.aiDraft}
                </p>
              ) : (
                <>
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder='Fill in the brief above, then click "Generate with AI"...'
                    className="min-h-56 resize-y text-sm leading-relaxed"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Optional steer — e.g. blunter hook, shorter, lead with the number"
                      className="min-w-48 flex-1 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && !generating && handleGenerate()}
                    />
                    <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generating || !postType}>
                      {generating ? <TbLoader className="animate-spin" size={14} /> : <TbSparkles size={14} />}
                      {post.aiDraft ? "Regenerate" : "Generate with AI"}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {draft.trim().length.toLocaleString()} characters
                    {draft.trim().length > 3000 && <span className="text-amber-600 dark:text-amber-400"> · over LinkedIn&apos;s 3,000 limit</span>}
                  </p>
                </>
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
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Post Image</p>
                {!isLive && meta?.visualSuggestion && (
                  <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <TbBulb size={13} className="mt-px shrink-0" />
                    <span>{meta.visualSuggestion}</span>
                  </p>
                )}
              </div>
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
                    {meta?.visualSuggestion && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => setImagePrompt(meta.visualSuggestion!)}
                        title="Use the AI's visual suggestion"
                      >
                        <TbWand size={13} />
                      </Button>
                    )}
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

          {/* Right column — feed preview + type structure */}
          <div className="space-y-4">
            {/* Feed preview */}
            <div className="space-y-3 rounded-xl glass-panel p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Feed Preview</p>
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-muted" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-foreground">
                      {post.organizationId ? "Rhinon Labs" : "Your profile"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Now · {post.visibility === "CONNECTIONS" ? "Connections" : "Public"}
                    </p>
                  </div>
                </div>
                {preview ? (
                  <p className="mt-2.5 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">
                    {preview}
                    {folded && (
                      <>
                        <span className="text-muted-foreground/60">…</span>{" "}
                        <span className="font-semibold text-muted-foreground">see more</span>
                      </>
                    )}
                  </p>
                ) : (
                  <p className="mt-2.5 text-[13px] italic text-muted-foreground/60">Nothing written yet.</p>
                )}
                {post.mediaUrl && <img src={post.mediaUrl} alt="" className="mt-2.5 w-full rounded-lg object-cover" />}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Everything after the fold is only read if the first {FOLD} characters earn it.
              </p>
            </div>

            {/* Generated meta */}
            {meta && (meta.hook || meta.cta || (meta.hashtags?.length ?? 0) > 0) && (
              <div className="space-y-2.5 rounded-xl glass-panel p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Generated</p>
                {meta.hook && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Hook</p>
                    <p className="text-xs leading-relaxed text-foreground/85">{meta.hook}</p>
                  </div>
                )}
                {meta.cta && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">CTA</p>
                    <p className="text-xs leading-relaxed text-foreground/85">{meta.cta}</p>
                  </div>
                )}
                {(meta.hashtags?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Hashtags</p>
                    <p className="text-xs text-blue-600 dark:text-blue-300">{meta.hashtags!.join(" ")}</p>
                  </div>
                )}
              </div>
            )}

            {/* Type structure */}
            {typeMeta && (
              <div className="space-y-2.5 rounded-xl glass-panel p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <typeMeta.icon size={13} /> {typeMeta.label} structure
                </p>
                <ol className="space-y-1.5">
                  {typeMeta.structure.map((step, i) => (
                    <li key={i} className="flex gap-2 text-[11px] leading-relaxed text-muted-foreground">
                      <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", typeMeta.dot)} />
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                {typeMeta.avoid && (
                  <p className="rounded-lg border border-border bg-muted/40 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
                    <span className="font-bold uppercase tracking-wide">Avoid: </span>
                    {typeMeta.avoid}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
