"use client";

import { useEffect, useState } from "react";
import { TbBrandLinkedin, TbBulb, TbCheck, TbCopy, TbLoader, TbSparkles } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TemplateImageField } from "./TemplateImageField";
import { CREATABLE_CHANNELS, EMPTY_TEMPLATE_FORM, isSocialChannel, type Template, type TemplateChannel } from "./types";

type Mode = "view" | "create" | "edit";

export function TemplateSheet({
  mode,
  template,
  open,
  onOpenChange,
  onSaved,
  onDeleted,
}: {
  mode: Mode;
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(mode === "create");
  const [form, setForm] = useState(EMPTY_TEMPLATE_FORM);
  const [saving, setSaving] = useState(false);

  // AI assist
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  // Image generation
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgGenerating, setImgGenerating] = useState(false);
  const [imgError, setImgError] = useState("");

  useEffect(() => {
    if (!open) return;
    setEditing(mode === "create");
    setAiPrompt("");
    setImgPrompt("");
    setImgError("");
    if (mode === "create") {
      setForm(EMPTY_TEMPLATE_FORM);
    } else if (template) {
      setForm({
        name: template.name,
        channel: template.channel || "Email",
        subject: template.subject || "",
        body: template.body,
        imageUrl: template.imageUrl || "",
        aiInstructions: template.aiInstructions || "",
        visibility: template.visibility || "PUBLIC",
        mediaTitle: template.mediaTitle || "",
        mediaDescription: template.mediaDescription || "",
        articleUrl: template.articleUrl || "",
      });
    }
  }, [open, mode, template]);

  const isSocial = isSocialChannel(form.channel);

  const handleAiAssist = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const data = await apiFetch<Partial<Template>>("/campaigns/templates/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: aiPrompt, channel: form.channel }),
      });
      setForm((f) => ({
        ...f,
        name: f.name || data.name || f.name,
        subject: data.subject || f.subject,
        body: data.body || f.body,
        aiInstructions: data.aiInstructions || f.aiInstructions,
      }));
      toast.success("Draft generated — review and adjust below");
    } catch (err: any) {
      toast.error("AI generation failed: " + err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imgPrompt.trim()) return;
    setImgGenerating(true);
    setImgError("");
    try {
      const data = await apiFetch<{ url: string }>("/ai/images/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: imgPrompt }),
      });
      setForm((f) => ({ ...f, imageUrl: data.url }));
      setImgPrompt("");
    } catch (err: any) {
      setImgError(err.message || "Image generation failed");
    } finally {
      setImgGenerating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (mode === "create") {
        await apiFetch("/campaigns/templates", { method: "POST", body: JSON.stringify(form) });
        toast.success("Template created");
      } else if (template) {
        await apiFetch(`/campaigns/templates/${template.id}`, { method: "PUT", body: JSON.stringify(form) });
        toast.success("Template updated");
      }
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!template) return;
    try {
      await apiFetch("/campaigns/templates", {
        method: "POST",
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          channel: template.channel,
          subject: template.subject,
          body: template.body,
          imageUrl: template.imageUrl,
          aiInstructions: template.aiInstructions,
          visibility: template.visibility,
          mediaTitle: template.mediaTitle,
          mediaDescription: template.mediaDescription,
          articleUrl: template.articleUrl,
        }),
      });
      toast.success("Template duplicated");
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Duplicate failed");
    }
  };

  const handleDelete = async () => {
    if (!template) return;
    const ok = await confirm({ title: "Delete this template?", confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    try {
      await apiFetch(`/campaigns/templates/${template.id}`, { method: "DELETE" });
      toast.success("Template deleted");
      onOpenChange(false);
      onDeleted();
    } catch {
      toast.error("Delete failed");
    }
  };

  const showEditor = mode !== "view" || editing;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle>
            {mode === "create" ? "New Template" : editing ? "Edit Template" : template?.name}
          </SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Write it yourself, or describe it and let AI draft a starting point."
              : editing
              ? "Update the content and settings for this template."
              : `${template?.channel} template`}
          </SheetDescription>
        </SheetHeader>

        {!showEditor && template ? (
          /* ---------- read-only view ---------- */
          <div className="flex flex-1 flex-col overflow-auto p-4">
            <div className="flex-1 space-y-4">
              {template.imageUrl && (
                <div className="overflow-hidden rounded-xl border border-border">
                  <img src={template.imageUrl} alt="Template" className="max-h-52 w-full object-cover" />
                </div>
              )}
              {!isSocialChannel(template.channel) && template.subject && (
                <div className="rounded-lg border border-border p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Subject Line</p>
                  <p className="text-sm font-medium text-foreground">{template.subject}</p>
                </div>
              )}
              {isSocialChannel(template.channel) && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border p-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Visibility</p>
                    <p className="text-sm font-medium text-foreground">{template.visibility || "PUBLIC"}</p>
                  </div>
                  {template.articleUrl && (
                    <div className="rounded-lg border border-border p-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Article URL</p>
                      <p className="truncate text-xs font-medium text-blue-600 dark:text-blue-300">{template.articleUrl}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="rounded-lg border border-border p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">
                  {isSocialChannel(template.channel) ? "Seed Content" : "Message Body"}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{template.body}</p>
              </div>
              {template.aiInstructions && (
                <div className="rounded-xl border border-violet-100 dark:border-violet-400/20 bg-violet-50/30 dark:bg-violet-400/10 p-4">
                  <p className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-violet-400">
                    <TbBulb size={13} /> AI Instructions
                  </p>
                  <p className="text-xs italic leading-relaxed text-foreground/70">{template.aiInstructions}</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 border-t pt-4">
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDuplicate}>
                  <TbCopy size={14} /> Duplicate
                </Button>
                <Button size="sm" onClick={() => setEditing(true)}>
                  Edit
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* ---------- create / edit form ---------- */
          <form onSubmit={handleSave} className="flex flex-1 flex-col gap-4 overflow-auto p-4">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Template Name</Label>
              <Input
                id="tpl-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. LinkedIn Thought Leadership"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v as TemplateChannel })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Email</SelectLabel>
                    {CREATABLE_CHANNELS.filter((c) => !isSocialChannel(c)).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>LinkedIn</SelectLabel>
                    {CREATABLE_CHANNELS.filter((c) => isSocialChannel(c)).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* AI assist strip */}
            <div className="space-y-2 rounded-xl border border-violet-100 dark:border-violet-400/20 bg-violet-50/30 dark:bg-violet-400/10 p-3">
              <Label className="flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-300">
                <TbSparkles size={13} /> Draft with AI
              </Label>
              <div className="flex gap-2">
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={
                    isSocial
                      ? "e.g. A thought leadership post about AI changing data analytics for mid-size companies"
                      : "e.g. A follow-up email for SaaS founders who haven't replied. Short and friendly."
                  }
                  className="h-16 flex-1 resize-none bg-card text-xs"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleAiAssist}
                disabled={aiGenerating || !aiPrompt.trim()}
              >
                {aiGenerating ? <TbLoader className="animate-spin" size={13} /> : <TbSparkles size={13} />}
                {aiGenerating ? "Generating..." : "Fill fields with AI"}
              </Button>
            </div>

            {!isSocial && (
              <div className="space-y-1.5">
                <Label htmlFor="tpl-subject">Subject Line</Label>
                <Input
                  id="tpl-subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Scaling {{lead.company}}'s potential"
                />
              </div>
            )}

            {isSocial && (
              <div className="space-y-3 rounded-xl border border-indigo-100 dark:border-indigo-400/20 bg-indigo-50/20 dark:bg-indigo-400/10 p-3">
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                  <TbBrandLinkedin size={12} /> LinkedIn Options
                </p>
                <div className="space-y-1.5">
                  <Label>Visibility</Label>
                  <Select
                    value={form.visibility}
                    onValueChange={(v) => setForm({ ...form, visibility: v as "PUBLIC" | "CONNECTIONS" })}
                  >
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public (Anyone)</SelectItem>
                      <SelectItem value="CONNECTIONS">Connections Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.channel === "LinkedIn Article" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="tpl-article-url">Article URL (optional)</Label>
                    <Input
                      id="tpl-article-url"
                      value={form.articleUrl}
                      onChange={(e) => setForm({ ...form, articleUrl: e.target.value })}
                      placeholder="https://your-blog.com/post"
                      className="bg-card"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="tpl-media-title">Media Title</Label>
                    <Input
                      id="tpl-media-title"
                      value={form.mediaTitle}
                      onChange={(e) => setForm({ ...form, mediaTitle: e.target.value })}
                      placeholder="Post headline"
                      className="bg-card"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tpl-media-desc">Media Description</Label>
                    <Input
                      id="tpl-media-desc"
                      value={form.mediaDescription}
                      onChange={(e) => setForm({ ...form, mediaDescription: e.target.value })}
                      placeholder="Short alt-text"
                      className="bg-card"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="tpl-body">{isSocial ? "Seed Content" : "Body"}</Label>
              <Textarea
                id="tpl-body"
                required
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="h-44 resize-none text-sm"
                placeholder={
                  isSocial
                    ? "Key talking points, themes, or a draft post the AI will expand..."
                    : "Hi {{lead.name}}, I noticed {{lead.company}} is..."
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-ai-instructions" className="flex items-center gap-1 text-violet-600 dark:text-violet-300">
                <TbBulb size={14} /> AI Instructions
              </Label>
              <Textarea
                id="tpl-ai-instructions"
                value={form.aiInstructions}
                onChange={(e) => setForm({ ...form, aiInstructions: e.target.value })}
                className="h-20 resize-none border-violet-100 dark:border-violet-400/20 bg-violet-50/30 dark:bg-violet-400/10 text-xs italic"
                placeholder={
                  isSocial
                    ? "Tell the AI the tone, hashtags to include, length target..."
                    : "Guide the AI on how to personalize per lead..."
                }
              />
            </div>

            <TemplateImageField
              currentUrl={form.imageUrl}
              prompt={imgPrompt}
              onPromptChange={setImgPrompt}
              onGenerate={handleGenerateImage}
              onClear={() => setForm({ ...form, imageUrl: "" })}
              generating={imgGenerating}
              error={imgError}
              manualUrl
              onManualUrl={(v) => setForm({ ...form, imageUrl: v })}
            />

            <div className="mt-auto flex items-center justify-end gap-3 border-t pt-4">
              {mode === "edit" && (
                <Button type="button" variant="ghost" onClick={() => setEditing(false)} className="mr-auto">
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <TbLoader className="animate-spin" size={14} />
                ) : (
                  <TbCheck size={14} />
                )}
                {mode === "create" ? "Save Template" : "Update Template"}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
