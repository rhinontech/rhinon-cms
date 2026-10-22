"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { TbArticle, TbBook2, TbChevronRight, TbEye, TbFolder, TbPlus, TbThumbDown, TbThumbUp, TbTrash } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch } from "@/lib/api";
import { timeAgo } from "@/lib/dates";
import { useModuleBase } from "@/lib/sites";
import { cn } from "@/lib/utils";
import { LoadingRows, Notice, Spinner } from "@/components/Admin/Settings/parts";
import { Chip, EmptyState, PageShell } from "./ui";
import { errorText } from "./chatbotApi";
import { HelpArticleEditor } from "./HelpArticleEditor";

interface Folder {
  id: string;
  name: string;
  description: string;
  position: number;
}

interface Article {
  id: string;
  folderId: string;
  title: string;
  content?: string;
  status: "draft" | "published";
  views: number;
  likes: number;
  dislikes: number;
  updatedAt: string;
}

type Selection = { kind: "folder"; id: string } | { kind: "article"; id: string } | null;

export function ChatbotHelpCenter() {
  const base = useModuleBase();
  const confirm = useConfirm();
  const { has } = usePermissions();
  const canEdit = has("chatbot:write");

  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [selection, setSelection] = useState<Selection>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [newFolder, setNewFolder] = useState(false);

  // The open article, as edited (saved on demand).
  const [article, setArticle] = useState<Article | null>(null);
  const [saved, setSaved] = useState<Article | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ folders: Folder[]; articles: Article[] }>("/chatbots/help");
      setFolders(res.folders);
      setArticles(res.articles);
      setError(null);
      setSelection((s) => s ?? (res.folders[0] ? { kind: "folder", id: res.folders[0].id } : null));
    } catch (err) {
      const message = errorText(err, "Could not load the help center");
      if (/no chatbot/i.test(message)) setMissing(true);
      else setError(message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = !!article && !!saved && (article.title !== saved.title || article.content !== saved.content || article.folderId !== saved.folderId);

  const confirmDiscard = async () =>
    !dirty || (await confirm({ title: "Discard your changes?", description: "This article has edits that aren't saved.", confirmLabel: "Discard", destructive: true }));

  const select = async (next: Selection) => {
    if (next?.kind === selection?.kind && next?.id === selection?.id) return;
    if (!(await confirmDiscard())) return;
    setSelection(next);
    setArticle(null);
    setSaved(null);
    if (next?.kind === "article") {
      try {
        const res = await apiFetch<{ article: Article }>(`/chatbots/help/articles/${next.id}`);
        setArticle(res.article);
        setSaved(res.article);
      } catch (err) {
        toast.error(errorText(err, "Could not open the article"));
      }
    }
  };

  const byFolder = useMemo(() => {
    const map = new Map<string, Article[]>();
    for (const a of articles) map.set(a.folderId, [...(map.get(a.folderId) ?? []), a]);
    return map;
  }, [articles]);

  const createFolder = async (name: string, description: string) => {
    try {
      const res = await apiFetch<{ folder: Folder }>("/chatbots/help/folders", { method: "POST", body: JSON.stringify({ name, description }) });
      setFolders((prev) => [...(prev ?? []), res.folder]);
      setNewFolder(false);
      await select({ kind: "folder", id: res.folder.id });
    } catch (err) {
      toast.error(errorText(err, "Could not create the collection"));
    }
  };

  const saveFolder = async (id: string, fields: Partial<Folder>) => {
    try {
      const res = await apiFetch<{ folder: Folder }>(`/chatbots/help/folders/${id}`, { method: "PATCH", body: JSON.stringify(fields) });
      setFolders((prev) => prev?.map((f) => (f.id === id ? res.folder : f)) ?? prev);
      toast.success("Collection saved");
    } catch (err) {
      toast.error(errorText(err, "Could not save the collection"));
    }
  };

  const deleteFolder = async (f: Folder) => {
    const count = byFolder.get(f.id)?.length ?? 0;
    const ok = await confirm({
      title: `Delete "${f.name}"?`,
      description: count ? `Its ${count} article${count === 1 ? "" : "s"} will be deleted too, and disappear from the widget.` : "It's empty, so nothing else is affected.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/chatbots/help/folders/${f.id}`, { method: "DELETE" });
      setFolders((prev) => prev?.filter((x) => x.id !== f.id) ?? prev);
      setArticles((prev) => prev.filter((a) => a.folderId !== f.id));
      setSelection(null);
    } catch (err) {
      toast.error(errorText(err, "Could not delete"));
    }
  };

  const createArticle = async (folderId: string) => {
    if (!(await confirmDiscard())) return;
    try {
      const res = await apiFetch<{ article: Article }>("/chatbots/help/articles", { method: "POST", body: JSON.stringify({ folderId, title: "Untitled article" }) });
      const { content: _content, ...summary } = res.article;
      setArticles((prev) => [...prev, summary]);
      setCollapsed((prev) => {
        const next = new Set(prev);
        next.delete(folderId);
        return next;
      });
      setSelection({ kind: "article", id: res.article.id });
      setArticle(res.article);
      setSaved(res.article);
    } catch (err) {
      toast.error(errorText(err, "Could not create the article"));
    }
  };

  const saveArticle = async (status?: Article["status"]) => {
    if (!article) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = { title: article.title, content: article.content ?? "", folderId: article.folderId };
      if (status) body.status = status;
      const res = await apiFetch<{ article: Article }>(`/chatbots/help/articles/${article.id}`, { method: "PATCH", body: JSON.stringify(body) });
      setArticle(res.article);
      setSaved(res.article);
      const { content: _content, ...summary } = res.article;
      setArticles((prev) => prev.map((a) => (a.id === summary.id ? summary : a)));
      toast.success(status === "published" ? "Published — it's live in the widget" : status === "draft" ? "Unpublished" : "Saved");
    } catch (err) {
      toast.error(errorText(err, "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  const deleteArticle = async () => {
    if (!article) return;
    const ok = await confirm({ title: `Delete "${article.title}"?`, description: "It disappears from the widget straight away.", confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    try {
      await apiFetch(`/chatbots/help/articles/${article.id}`, { method: "DELETE" });
      setArticles((prev) => prev.filter((a) => a.id !== article.id));
      setSelection({ kind: "folder", id: article.folderId });
      setArticle(null);
      setSaved(null);
    } catch (err) {
      toast.error(errorText(err, "Could not delete"));
    }
  };

  const published = articles.filter((a) => a.status === "published").length;

  if (missing) {
    return (
      <PageShell title="Help center">
        <Notice tone="info">
          Create the chatbot first. <Link href={base} className="font-medium underline underline-offset-2">Go to Overview →</Link>
        </Notice>
      </PageShell>
    );
  }

  const folder = selection?.kind === "folder" ? folders?.find((f) => f.id === selection.id) : undefined;

  return (
    <PageShell
      flush
      title="Help center"
      subtitle={folders ? `${published} published article${published === 1 ? "" : "s"} in the widget's Help tab` : "Answers visitors can read in the widget's Help tab"}
      actions={
        canEdit && (
          <Button size="sm" variant="outline" onClick={() => setNewFolder(true)} data-testid="new-collection">
            <TbPlus size={14} /> Collection
          </Button>
        )
      }
    >
      <div className="flex h-full overflow-hidden" data-testid="chatbot-help">
        {/* Collections and their articles */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-border/70">
          <div className="flex-1 overflow-auto p-2" data-testid="help-tree">
            {error && <div className="p-2"><Notice tone="danger">{error}</Notice></div>}
            {!folders && !error && <div className="p-2"><LoadingRows rows={5} /></div>}
            {folders?.length === 0 && (
              <EmptyState
                icon={<TbBook2 size={22} />}
                title="No collections yet"
                body="Group articles into collections like “Billing” or “Getting started”."
                action={canEdit && <Button size="sm" onClick={() => setNewFolder(true)}><TbPlus size={14} /> New collection</Button>}
              />
            )}
            {folders?.map((f) => {
              const list = byFolder.get(f.id) ?? [];
              const isOpen = !collapsed.has(f.id);
              const active = selection?.kind === "folder" && selection.id === f.id;
              return (
                <div key={f.id} className="mb-0.5">
                  <div className={cn("group flex items-center rounded-xl transition-colors", active ? "bg-foreground/[0.06] dark:bg-white/[0.07]" : "hover:bg-muted/60")}>
                    <button
                      type="button"
                      aria-label={isOpen ? "Collapse" : "Expand"}
                      onClick={() =>
                        setCollapsed((prev) => {
                          const next = new Set(prev);
                          if (next.has(f.id)) next.delete(f.id);
                          else next.add(f.id);
                          return next;
                        })
                      }
                      className="flex size-8 shrink-0 items-center justify-center text-muted-foreground"
                    >
                      <TbChevronRight size={14} className={cn("transition-transform", isOpen && "rotate-90")} />
                    </button>
                    <button type="button" onClick={() => void select({ kind: "folder", id: f.id })} className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-2 text-left" data-testid={`collection-${f.id}`}>
                      <TbFolder size={15} className="shrink-0 text-muted-foreground" />
                      <span className="truncate text-[13px] font-medium">{f.name}</span>
                      <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">{list.length}</span>
                    </button>
                  </div>
                  {isOpen && (
                    <div className="ml-4 border-l border-border/70 pl-2">
                      {list.map((a) => {
                        const on = selection?.kind === "article" && selection.id === a.id;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => void select({ kind: "article", id: a.id })}
                            className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors", on ? "bg-foreground/[0.06] dark:bg-white/[0.07]" : "hover:bg-muted/60")}
                            data-testid={`article-${a.id}`}
                          >
                            <span className={cn("size-1.5 shrink-0 rounded-full", a.status === "published" ? "bg-emerald-500" : "bg-muted-foreground/40")} title={a.status === "published" ? "Published" : "Draft"} />
                            <span className={cn("truncate text-[13px]", on ? "font-medium text-foreground" : "text-foreground/80")}>{a.title}</span>
                          </button>
                        );
                      })}
                      {canEdit && (
                        <button type="button" onClick={() => void createArticle(f.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-muted-foreground hover:bg-muted/60 hover:text-foreground">
                          <TbPlus size={13} /> New article
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Collection settings or the article editor */}
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {selection?.kind === "article" ? (
            !article ? (
              <EmptyState className="flex-1" icon={<Spinner />} title="Opening…" />
            ) : (
              <>
                <div className="flex items-center gap-2 border-b border-border/70 px-5 py-2.5">
                  <Chip tone={article.status === "published" ? "green" : "neutral"}>{article.status === "published" ? "Published" : "Draft"}</Chip>
                  <span className="truncate text-xs text-muted-foreground">{dirty ? "Unsaved changes" : `Saved ${timeAgo(article.updatedAt)}`}</span>
                  <span className="ml-auto hidden items-center gap-3 text-xs tabular-nums text-muted-foreground lg:flex">
                    <span className="inline-flex items-center gap-1"><TbEye size={13} /> {article.views}</span>
                    <span className="inline-flex items-center gap-1"><TbThumbUp size={13} /> {article.likes}</span>
                    <span className="inline-flex items-center gap-1"><TbThumbDown size={13} /> {article.dislikes}</span>
                  </span>
                  {canEdit && (
                    <div className="ml-3 flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => void deleteArticle()} aria-label="Delete article">
                        <TbTrash size={14} />
                      </Button>
                      {article.status === "published" ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => void saveArticle("draft")} disabled={saving}>Unpublish</Button>
                          <Button size="sm" onClick={() => void saveArticle()} disabled={saving || !dirty} data-testid="save-article">
                            {saving && <Spinner />} Save
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => void saveArticle()} disabled={saving || !dirty} data-testid="save-article">Save draft</Button>
                          <Button size="sm" onClick={() => void saveArticle("published")} disabled={saving} data-testid="publish-article">
                            {saving && <Spinner />} Publish
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-auto">
                  <div className="mx-auto flex max-w-3xl flex-col gap-4 p-5 sm:p-7">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <TbFolder size={13} />
                      <select
                        value={article.folderId}
                        onChange={(e) => setArticle({ ...article, folderId: e.target.value })}
                        disabled={!canEdit}
                        className="rounded-lg border border-transparent bg-transparent py-0.5 text-xs hover:border-border"
                        aria-label="Collection"
                        data-testid="article-folder"
                      >
                        {folders?.map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      value={article.title}
                      onChange={(e) => setArticle({ ...article, title: e.target.value })}
                      readOnly={!canEdit}
                      placeholder="Article title"
                      maxLength={200}
                      className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50"
                      data-testid="article-title"
                    />
                    <HelpArticleEditor key={article.id} html={saved?.content ?? ""} onChange={(content) => setArticle((a) => (a ? { ...a, content } : a))} editable={canEdit} />
                  </div>
                </div>
              </>
            )
          ) : folder ? (
            <FolderPanel
              key={folder.id}
              folder={folder}
              articles={byFolder.get(folder.id) ?? []}
              canEdit={canEdit}
              onSave={(fields) => void saveFolder(folder.id, fields)}
              onDelete={() => void deleteFolder(folder)}
              onNewArticle={() => void createArticle(folder.id)}
              onOpen={(id) => void select({ kind: "article", id })}
            />
          ) : (
            folders &&
            folders.length > 0 && <EmptyState className="flex-1" icon={<TbArticle size={24} />} title="Pick a collection or article" body="Published articles show up in the widget's Help tab, grouped by collection." />
          )}
        </section>
      </div>

      <NewFolderDialog open={newFolder} onClose={() => setNewFolder(false)} onCreate={createFolder} />
    </PageShell>
  );
}

function FolderPanel({
  folder,
  articles,
  canEdit,
  onSave,
  onDelete,
  onNewArticle,
  onOpen,
}: {
  folder: Folder;
  articles: Article[];
  canEdit: boolean;
  onSave: (fields: Partial<Folder>) => void;
  onDelete: () => void;
  onNewArticle: () => void;
  onOpen: (id: string) => void;
}) {
  const [name, setName] = useState(folder.name);
  const [description, setDescription] = useState(folder.description);
  const changed = name.trim() !== folder.name || description.trim() !== folder.description;

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-5 sm:p-7" data-testid="collection-panel">
        <div className="flex flex-col gap-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} readOnly={!canEdit} maxLength={120} className="h-10 text-base font-semibold" aria-label="Collection name" data-testid="collection-name" />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            readOnly={!canEdit}
            maxLength={400}
            placeholder="One line on what's inside — visitors see it under the name."
            className="min-h-[64px] resize-none text-sm"
            aria-label="Collection description"
          />
          {canEdit && (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => onSave({ name: name.trim(), description: description.trim() })} disabled={!changed || !name.trim()} data-testid="save-collection">Save</Button>
              <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-600 dark:text-red-400" onClick={onDelete}>
                <TbTrash size={14} /> Delete collection
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Articles</p>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={onNewArticle} data-testid="new-article">
                <TbPlus size={14} /> New article
              </Button>
            )}
          </div>
          {articles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-[13px] text-muted-foreground">
              No articles yet. A collection only shows in the widget once it has a published article.
            </div>
          ) : (
            <div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border">
              {articles.map((a) => (
                <button key={a.id} type="button" onClick={() => onOpen(a.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50">
                  <TbArticle size={16} className="shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{a.title}</span>
                  <span className="hidden items-center gap-1 text-[11px] tabular-nums text-muted-foreground sm:inline-flex"><TbEye size={12} /> {a.views}</span>
                  <Chip tone={a.status === "published" ? "green" : "neutral"}>{a.status === "published" ? "Published" : "Draft"}</Chip>
                  <span className="w-16 text-right text-[11px] text-muted-foreground">{timeAgo(a.updatedAt)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NewFolderDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (name: string, description: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
    }
  }, [open]);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    await onCreate(name.trim(), description.trim());
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>Collections group related articles in the widget's Help tab.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Billing and payments" maxLength={120} data-testid="new-collection-name" />
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description (optional)" maxLength={400} className="min-h-[64px] resize-none" />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy || !name.trim()} data-testid="create-collection">
              {busy && <Spinner />} Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
