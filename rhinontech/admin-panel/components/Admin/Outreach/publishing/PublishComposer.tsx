"use client";

import { useEffect, useMemo, useState } from "react";
import { TbArticle, TbBrandLinkedin, TbLoader, TbVideo } from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Campaign, Template } from "../shared/types";

const POST_TYPES = [
  { channel: "LinkedIn Post", icon: <TbBrandLinkedin size={20} />, title: "Post", description: "Text post, optionally with an image" },
  { channel: "LinkedIn Video", icon: <TbVideo size={20} />, title: "Video", description: "Native video upload with caption" },
  { channel: "LinkedIn Article", icon: <TbArticle size={20} />, title: "Article", description: "Share a long-form article link" },
] as const;

export function PublishComposer({
  open,
  onOpenChange,
  templates,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: Template[];
  onCreated: (campaign: Campaign) => void;
}) {
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
      apiFetch<{ id: string; name: string }[]>("/linkedin/organizations").then(setOrgs).catch(() => setOrgs([]));
    }
  }, [open]);

  const socialTemplates = useMemo(
    () => templates.filter((t) => t.channel && t.channel.startsWith("LinkedIn")),
    [templates]
  );

  const reset = () => {
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
    setSaving(true);
    try {
      const campaign = await apiFetch<Campaign>("/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name,
          channel,
          templateId: templateId || null,
          articleUrl: channel === "LinkedIn Article" ? articleUrl || null : null,
          visibility,
          organizationId: organizationId === "personal" ? null : organizationId,
        }),
      });
      toast.success("Draft created — generate content, then publish when ready.");
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
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle>New LinkedIn Post</SheetTitle>
          <SheetDescription>Draft first — nothing publishes until you hit Publish on the post page.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleCreate} className="flex flex-1 flex-col gap-4 overflow-auto p-4">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {POST_TYPES.map((t) => (
                <button
                  key={t.channel}
                  type="button"
                  onClick={() => setChannel(t.channel)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-colors",
                    channel === t.channel
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-400/10 text-blue-600 dark:text-blue-300"
                      : "border-border bg-card text-muted-foreground hover:border-border"
                  )}
                >
                  {t.icon}
                  <span className="text-xs font-bold text-foreground">{t.title}</span>
                  <span className="text-[10px] leading-tight text-muted-foreground">{t.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="post-name">Title (internal)</Label>
            <Input
              id="post-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. FurrCircle launch announcement"
            />
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

          <div className="mt-auto flex justify-end border-t pt-4">
            <Button type="submit" disabled={saving}>
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
