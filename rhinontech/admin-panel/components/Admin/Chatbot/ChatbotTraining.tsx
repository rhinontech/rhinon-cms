"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { TbFileText, TbNotes, TbRefresh, TbSchool, TbSitemap, TbTrash, TbUpload, TbWorld } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch, apiUploadMany } from "@/lib/api";
import { timeAgo } from "@/lib/dates";
import { useModuleBase } from "@/lib/sites";
import { cn } from "@/lib/utils";
import { LoadingRows, Notice, Pill, SettingsCard, SettingsFrame, Spinner } from "@/components/Admin/Settings/parts";
import { errorText, useChatEvents, type ChatbotSource, type TrainingState } from "./chatbotApi";

type Tab = "website" | "files" | "notes";

const ACCEPT = ".pdf,.docx,.pptx,.txt,.md,.csv";

const STATUS_PILL: Record<ChatbotSource["status"], { tone: "green" | "amber" | "red" | "blue" | "gray"; label: string }> = {
  pending: { tone: "gray", label: "Not trained" },
  training: { tone: "blue", label: "Training…" },
  trained: { tone: "green", label: "Trained" },
  failed: { tone: "red", label: "Failed" },
};

const KIND_ICON: Record<ChatbotSource["kind"], React.ReactNode> = {
  url: <TbWorld size={16} />,
  sitemap: <TbSitemap size={16} />,
  file: <TbFileText size={16} />,
  text: <TbNotes size={16} />,
};

export function ChatbotTraining() {
  const base = useModuleBase();
  const confirm = useConfirm();
  const { has } = usePermissions();
  const canEdit = has("chatbot:write");
  const [sources, setSources] = useState<ChatbotSource[] | null>(null);
  const [training, setTraining] = useState<TrainingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [tab, setTab] = useState<Tab>("website");

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ sources: ChatbotSource[]; training: TrainingState }>("/chatbots/sources");
      setSources(res.sources);
      setTraining(res.training);
      setError(null);
    } catch (err) {
      const message = errorText(err, "Could not load training");
      if (/no chatbot/i.test(message)) setMissing(true);
      else setError(message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useChatEvents({
    "chatbot:source": (e: { source: ChatbotSource }) =>
      setSources((prev) => (prev ? prev.map((s) => (s.id === e.source.id ? e.source : s)) : prev)),
    "chatbot:training": (e: { status: TrainingState["status"]; progress: number; message: string }) => {
      setTraining((prev) => ({
        running: e.progress < 100 && e.status === "training",
        status: e.status,
        progress: e.progress,
        message: e.message,
        lastTrainedAt: prev?.lastTrainedAt ?? null,
      }));
      if (e.progress >= 100) {
        void load();
        if (e.status === "failed") toast.error(e.message);
        else toast.success(e.message);
      }
    },
  });

  const train = async () => {
    try {
      const res = await apiFetch<{ started: boolean; message: string }>("/chatbots/train", { method: "POST" });
      setTraining((prev) => ({ ...(prev ?? { status: "training", progress: 0, message: null, lastTrainedAt: null }), running: true, status: "training", progress: 0, message: res.message }));
    } catch (err) {
      toast.error(errorText(err, "Could not start training"));
    }
  };

  const remove = async (source: ChatbotSource) => {
    const ok = await confirm({
      title: `Remove ${source.title}?`,
      description: "The bot forgets everything it learned from this source straight away.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/chatbots/sources/${source.id}`, { method: "DELETE" });
      setSources((prev) => prev?.filter((s) => s.id !== source.id) ?? prev);
    } catch (err) {
      toast.error(errorText(err, "Could not remove the source"));
    }
  };

  const retrain = async (source: ChatbotSource) => {
    try {
      await apiFetch(`/chatbots/sources/${source.id}/retrain`, { method: "POST" });
      setSources((prev) => prev?.map((s) => (s.id === source.id ? { ...s, status: "pending", error: null } : s)) ?? prev);
      setTraining((prev) => (prev ? { ...prev, running: true, status: "training" } : prev));
    } catch (err) {
      toast.error(errorText(err, "Could not retrain"));
    }
  };

  const added = (created: ChatbotSource[]) => setSources((prev) => [...created, ...(prev ?? [])]);

  const pending = sources?.filter((s) => s.status === "pending" || s.status === "failed").length ?? 0;
  const trained = sources?.filter((s) => s.status === "trained") ?? [];
  const chunkTotal = trained.reduce((n, s) => n + s.chunkCount, 0);
  const running = !!training?.running;

  if (missing) {
    return (
      <SettingsFrame title="Training">
        <Notice tone="info">
          Create the chatbot first. <Link href={base} className="font-medium underline underline-offset-2">Go to Overview →</Link>
        </Notice>
      </SettingsFrame>
    );
  }

  return (
    <SettingsFrame
      title="Training"
      description="What the bot answers from. It never makes up facts beyond these."
      actions={
        canEdit && (
          <Button onClick={train} disabled={running || pending === 0} data-testid="train-now">
            {running ? <Spinner /> : <TbSchool size={16} />}
            {running ? "Training…" : pending ? `Train ${pending} new source${pending === 1 ? "" : "s"}` : "All trained"}
          </Button>
        )
      }
    >
      {error && <Notice tone="danger">{error}</Notice>}

      {running && training && (
        <SettingsCard testId="training-progress">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{training.message || "Training…"}</span>
            <span className="tabular-nums text-muted-foreground">{training.progress}%</span>
          </div>
          <Progress value={training.progress} className="mt-3" />
          <p className="mt-2 text-xs text-muted-foreground">You can leave this page — training carries on and the bot uses each source as soon as it is done.</p>
        </SettingsCard>
      )}

      {canEdit && (
        <SettingsCard title="Add a source">
          <div className="mb-4 inline-flex rounded-lg border border-border p-0.5" role="tablist">
            {(
              [
                ["website", "Website", <TbWorld key="w" size={15} />],
                ["files", "Documents", <TbFileText key="f" size={15} />],
                ["notes", "Notes", <TbNotes key="n" size={15} />],
              ] as const
            ).map(([key, label, icon]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                data-testid={`tab-${key}`}
                onClick={() => setTab(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
          {tab === "website" && <AddWebsite onAdded={added} />}
          {tab === "files" && <AddFiles onAdded={added} />}
          {tab === "notes" && <AddNote onAdded={added} />}
        </SettingsCard>
      )}

      <SettingsCard
        title="Sources"
        description={
          sources && sources.length
            ? `${trained.length} of ${sources.length} trained · ${chunkTotal.toLocaleString()} passages${training?.lastTrainedAt ? ` · last trained ${timeAgo(training.lastTrainedAt)}` : ""}`
            : undefined
        }
      >
        {!sources && <LoadingRows rows={3} />}
        {sources && sources.length === 0 && (
          <p className="text-sm text-muted-foreground" data-testid="no-sources">
            Nothing yet. Add your website first — most of what visitors ask is already on it.
          </p>
        )}
        {sources && sources.length > 0 && (
          <ul className="divide-y divide-border" data-testid="source-list">
            {sources.map((s) => (
              <li key={s.id} className="flex items-start gap-3 py-3" data-testid={`source-${s.id}`}>
                <span className="mt-0.5 text-muted-foreground">{KIND_ICON[s.kind]}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground" title={s.url ?? s.title}>{s.title}</span>
                    <Pill tone={STATUS_PILL[s.status].tone}>{STATUS_PILL[s.status].label}</Pill>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {s.kind === "sitemap" ? "Whole site · " : ""}
                    {s.url ?? (s.kind === "file" ? s.fileName : "Note")}
                    {s.status === "trained" &&
                      ` · ${s.kind === "sitemap" ? `${s.pageCount} pages · ` : ""}${s.chunkCount} passage${s.chunkCount === 1 ? "" : "s"}`}
                  </p>
                  {s.status === "failed" && s.error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{s.error}</p>}
                </div>
                {canEdit && (
                  <div className="flex shrink-0 items-center gap-1">
                    {(s.status === "trained" || s.status === "failed") && (
                      <Button variant="ghost" size="icon" title="Train again" aria-label={`Train ${s.title} again`} onClick={() => retrain(s)} disabled={running}>
                        <TbRefresh size={16} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Remove"
                      aria-label={`Remove ${s.title}`}
                      onClick={() => remove(s)}
                      disabled={s.status === "training"}
                      className="text-muted-foreground hover:text-red-600"
                    >
                      <TbTrash size={16} />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>
    </SettingsFrame>
  );
}

function AddWebsite({ onAdded }: { onAdded: (s: ChatbotSource[]) => void }) {
  const [url, setUrl] = useState("");
  const [checking, setChecking] = useState(false);
  const [found, setFound] = useState<{ url: string; title: string; domain: string; sitemapPages: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const normalized = () => {
    const v = url.trim();
    return /^https?:\/\//i.test(v) ? v : `https://${v}`;
  };

  const check = async () => {
    if (!url.trim()) return;
    setChecking(true);
    setFound(null);
    try {
      setFound(await apiFetch("/chatbots/analyze-url", { method: "POST", body: JSON.stringify({ url: normalized() }) }));
    } catch (err) {
      toast.error(errorText(err, "That website could not be reached"));
    } finally {
      setChecking(false);
    }
  };

  const add = async (kind: "url" | "sitemap") => {
    if (!found) return;
    setSaving(true);
    try {
      const res = await apiFetch<{ source: ChatbotSource }>("/chatbots/sources", {
        method: "POST",
        body: JSON.stringify({ kind, url: found.url, title: kind === "sitemap" ? `${found.domain} (whole site)` : found.title }),
      });
      onAdded([res.source]);
      setUrl("");
      setFound(null);
      toast.success("Added — click Train when you're ready");
    } catch (err) {
      toast.error(errorText(err, "Could not add the website"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void check();
        }}
      >
        <div className="grid min-w-[240px] flex-1 gap-1.5">
          <Label htmlFor="train-url">Website or page</Label>
          <Input id="train-url" data-testid="train-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="yourcompany.com" autoComplete="off" spellCheck={false} />
        </div>
        <Button type="submit" variant="outline" disabled={checking || !url.trim()} data-testid="check-url">
          {checking ? <Spinner /> : <TbWorld size={16} />} Check
        </Button>
      </form>
      {found && (
        <div className="rounded-lg border border-border bg-card p-3" data-testid="url-found">
          <p className="text-sm font-medium">{found.title}</p>
          <p className="text-xs text-muted-foreground">{found.url}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {found.sitemapPages > 0 && (
              <Button size="sm" onClick={() => add("sitemap")} disabled={saving} data-testid="add-sitemap">
                <TbSitemap size={15} /> Whole site ({Math.min(found.sitemapPages, 200)} pages)
              </Button>
            )}
            <Button size="sm" variant={found.sitemapPages > 0 ? "outline" : "default"} onClick={() => add("url")} disabled={saving} data-testid="add-page">
              <TbWorld size={15} /> Just this page
            </Button>
          </div>
          {found.sitemapPages === 0 && <p className="mt-2 text-xs text-muted-foreground">No sitemap found, so pages are added one at a time.</p>}
        </div>
      )}
    </div>
  );
}

function AddFiles({ onAdded }: { onAdded: (s: ChatbotSource[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const res = await apiUploadMany<{ sources: ChatbotSource[] }>("/chatbots/sources/upload", Array.from(files).slice(0, 10));
      onAdded(res.sources);
      toast.success(`${res.sources.length} document${res.sources.length === 1 ? "" : "s"} added — click Train when you're ready`);
    } catch (err) {
      toast.error(errorText(err, "Upload failed"));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void upload(e.dataTransfer.files);
      }}
    >
      <TbUpload size={22} className="text-muted-foreground" />
      <p className="text-sm font-medium">Drop files here or choose them</p>
      <p className="text-xs text-muted-foreground">PDF, Word (.docx), PowerPoint (.pptx), TXT, Markdown or CSV · up to 20 MB each · 10 at a time</p>
      <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" data-testid="file-input" onChange={(e) => void upload(e.target.files)} />
      <Button variant="outline" size="sm" onClick={() => input.current?.click()} disabled={uploading} className="mt-1">
        {uploading ? <Spinner /> : <TbUpload size={15} />} Choose files
      </Button>
    </div>
  );
}

function AddNote({ onAdded }: { onAdded: (s: ChatbotSource[]) => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async () => {
    setSaving(true);
    try {
      const res = await apiFetch<{ source: ChatbotSource }>("/chatbots/sources", {
        method: "POST",
        body: JSON.stringify({ kind: "text", title: title.trim() || "Note", content }),
      });
      onAdded([res.source]);
      setTitle("");
      setContent("");
      toast.success("Note added — click Train when you're ready");
    } catch (err) {
      toast.error(errorText(err, "Could not add the note"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void add();
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="note-title">Title</Label>
        <Input id="note-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pricing, refund policy, opening hours…" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="note-content">What the bot should know</Label>
        <Textarea
          id="note-content"
          data-testid="note-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="Facts the website doesn't say, in plain sentences. E.g. 'We reply to support emails within 4 working hours, Monday to Friday.'"
        />
      </div>
      <div>
        <Button type="submit" disabled={saving || content.trim().length < 20} data-testid="add-note">
          {saving ? <Spinner /> : <TbNotes size={15} />} Add note
        </Button>
      </div>
    </form>
  );
}
