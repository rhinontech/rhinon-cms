"use client";

import { useEffect, useMemo, useState } from "react";
import { TbAlertTriangle, TbArticle, TbBrandLinkedin, TbLoader, TbVideo } from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Campaign, Template } from "../shared/types";
import { AUDIENCE_META, POST_AUDIENCES, POST_TYPE_LIST, type PostAudience, type PostType } from "./postTypes";

const FORMATS = [
  { channel: "LinkedIn Post", icon: <TbBrandLinkedin size={17} />, title: "Post", description: "Text, optionally with an image" },
  { channel: "LinkedIn Video", icon: <TbVideo size={17} />, title: "Video", description: "Native video with caption" },
  { channel: "LinkedIn Article", icon: <TbArticle size={17} />, title: "Article", description: "Share a long-form link" },
] as const;

export function PublishComposer({
  open,
  onOpenChange,
  templates,
  onCreated,
  suggestedType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: Template[];
  onCreated: (campaign: Campaign) => void;
  /** The type the cadence tracker thinks is due next. */
  suggestedType?: PostType | null;
}) {
  const [postType, setPostType] = useState<PostType | null>(null);
  const [postAudience, setPostAudience] = useState<PostAudience>("SMB_OPERATIONS");
  const [topic, setTopic] = useState("");
  const [sourceFacts, setSourceFacts] = useState("");
  const [channel, setChannel] = useState<string>("LinkedIn Post");
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "CONNECTIONS">("PUBLIC");
  const [organizationId, setOrganizationId] = useState("personal");
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPostType(suggestedType ?? null);
      apiFetch<{ id: string; name: string }[]>("/linkedin/organizations").then(setOrgs).catch(() => setOrgs([]));
    }
  }, [open, suggestedType]);

  const socialTemplates = useMemo(
    () => templates.filter((t) => t.channel && t.channel.startsWith("LinkedIn")),
    [templates]
  );

  const selected = postType ? POST_TYPE_LIST.find((t) => t.id === postType)! : null;
  // A Case Study makes claims about a real client, so it can't be written from nothing.
  const factsRequired = postType === "CASE_STUDY";
  const factsMissing = factsRequired && !sourceFacts.trim();

  const reset = () => {
    setPostType(null);
    setPostAudience("SMB_OPERATIONS");
    setTopic("");
    setSourceFacts("");
    setChannel("LinkedIn Post");
    setName("");
    setTemplateId("");
    setArticleUrl("");
    setVisibility("PUBLIC");
    setOrganizationId("personal");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postType) {
      toast.error("Pick a post type first.");
      return;
    }
    setSaving(true);
    try {
      const campaign = await apiFetch<Campaign>("/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name,
          channel,
          postType,
          postAudience,
          topic: topic.trim() || null,
          sourceFacts: sourceFacts.trim() || null,
          templateId: templateId || null,
          articleUrl: channel === "LinkedIn Article" ? articleUrl || null : null,
          visibility,
          organizationId: organizationId === "personal" ? null : organizationId,
        }),
      });
      toast.success("Draft created — generate the post, then publish when ready.");
      handleOpenChange(false);
      onCreated(campaign);
    } catch (err: any) {
      toast.error(err.message || "Failed to create post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-2xl">
        <SheetHeader className="border-b">
          <SheetTitle>New LinkedIn Post</SheetTitle>
          <SheetDescription>
            Pick one of the five post types — the AI writes to that type&apos;s structure. Nothing publishes until you hit
            Publish.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleCreate} className="flex flex-1 flex-col gap-5 overflow-auto p-4">
          {/* 1 — Post type */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label>Post type</Label>
              {suggestedType && (
                <span className="text-[11px] text-muted-foreground">
                  Cadence suggests <span className="font-semibold text-foreground">{POST_TYPE_LIST.find((t) => t.id === suggestedType)?.label}</span> next
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {POST_TYPE_LIST.map((t) => {
                const Icon = t.icon;
                const active = postType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPostType(t.id)}
                    className={cn(
                      "flex items-start gap-2.5 rounded-xl border-2 p-3 text-left transition-colors",
                      active ? "border-blue-500 bg-blue-50/50 dark:bg-blue-400/10" : "border-border bg-card hover:border-muted-foreground/30"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
                        t.dot
                      )}
                    >
                      {t.n}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <Icon size={13} /> {t.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{t.does}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selected && (
            <>
              <div className={cn("rounded-xl border p-3 text-[11px] leading-relaxed", selected.chip)}>
                <p>
                  <span className="font-bold uppercase tracking-wide">What it gets you: </span>
                  {selected.gets}
                </p>
                {selected.avoid && (
                  <p className="mt-1.5 opacity-90">
                    <span className="font-bold uppercase tracking-wide">Avoid: </span>
                    {selected.avoid}
                  </p>
                )}
              </div>

              {/* 2 — Brief */}
              <div className="space-y-1.5">
                <Label htmlFor="post-name">Title (internal)</Label>
                <Input
                  id="post-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Spreadsheet dependency story"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="post-topic">Topic / angle</Label>
                <Textarea
                  id="post-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="What is this post about? e.g. Client had six SaaS tools and still rebuilt one spreadsheet by hand every morning."
                  className="min-h-20 text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Leave blank and the AI picks a topic from the Rhinon Labs topic bank.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="post-facts">
                  Verified facts {factsRequired ? <span className="text-red-600 dark:text-red-400">*</span> : <span className="font-normal text-muted-foreground">(optional)</span>}
                </Label>
                <Textarea
                  id="post-facts"
                  value={sourceFacts}
                  onChange={(e) => setSourceFacts(e.target.value)}
                  placeholder="Real client names, real numbers, real outcomes, real timelines. Only what you can stand behind."
                  className={cn("min-h-24 text-sm", factsMissing && "border-red-400 dark:border-red-500/50")}
                />
                <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <TbAlertTriangle size={13} className="mt-px shrink-0" />
                  <span>
                    This is the only source the AI may draw metrics, clients and outcomes from. Anything it needs and
                    doesn&apos;t have comes back flagged as <span className="font-mono">[INPUT NEEDED]</span> instead of invented.
                  </span>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Audience</Label>
                <div className="grid grid-cols-2 gap-2">
                  {POST_AUDIENCES.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setPostAudience(a)}
                      className={cn(
                        "rounded-xl border-2 p-2.5 text-left transition-colors",
                        postAudience === a ? "border-blue-500 bg-blue-50/50 dark:bg-blue-400/10" : "border-border bg-card hover:border-muted-foreground/30"
                      )}
                    >
                      <span className="block text-xs font-bold text-foreground">{AUDIENCE_META[a].label}</span>
                      <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">
                        {AUDIENCE_META[a].description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 — Delivery */}
              <div className="space-y-1.5">
                <Label>Format</Label>
                <div className="grid grid-cols-3 gap-2">
                  {FORMATS.map((f) => (
                    <button
                      key={f.channel}
                      type="button"
                      onClick={() => setChannel(f.channel)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 text-center transition-colors",
                        channel === f.channel
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-400/10 text-blue-600 dark:text-blue-300"
                          : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30"
                      )}
                    >
                      {f.icon}
                      <span className="text-xs font-bold text-foreground">{f.title}</span>
                      <span className="text-[10px] leading-tight text-muted-foreground">{f.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {channel === "LinkedIn Article" && (
                <div className="space-y-1.5">
                  <Label htmlFor="article-url">Article URL</Label>
                  <Input
                    id="article-url"
                    type="url"
                    value={articleUrl}
                    onChange={(e) => setArticleUrl(e.target.value)}
                    placeholder="https://rhinonlabs.com/blogs/..."
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Template (optional)</Label>
                <Select value={templateId || "none"} onValueChange={(v) => setTemplateId(v === "none" ? "" : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template</SelectItem>
                    {socialTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Publish As</Label>
                  <Select value={organizationId} onValueChange={setOrganizationId}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal profile</SelectItem>
                      {orgs.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Visibility</Label>
                  <Select value={visibility} onValueChange={(v) => setVisibility(v as any)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="CONNECTIONS">Connections only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
            <p className="text-[11px] text-muted-foreground">
              {factsMissing ? "A case study needs verified facts before it can be written." : " "}
            </p>
            <Button type="submit" disabled={saving || !postType || factsMissing}>
              {saving ? (
                <>
                  <TbLoader className="animate-spin" size={14} /> Creating...
                </>
              ) : (
                "Create Draft →"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
