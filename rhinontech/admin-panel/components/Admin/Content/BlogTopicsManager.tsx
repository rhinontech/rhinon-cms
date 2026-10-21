"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { TbSparkles, TbPlus, TbTrash, TbLoader, TbPencil, TbAlertTriangle, TbPhoto, TbRefresh } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { confirmDialog, alertDialog } from "@/components/ui/dialogs";

type TopicStatus = "Queued" | "Generating" | "Drafted" | "Failed";

interface BlogTopic {
  id: string;
  title: string;
  keyword: string | null;
  audience: string | null;
  notes: string | null;
  targetPage: string | null;
  withImages: boolean;
  status: TopicStatus;
  blogId: string | null;
  error: string | null;
  generatedAt: string | null;
  createdAt: string;
}

const EMPTY = { title: "", keyword: "", audience: "", notes: "", targetPage: "", withImages: true };

const TARGET_PAGES = [
  "/services/mvp-development",
  "/services/ai-agents",
  "/services/workflow-automation",
  "/services/internal-dashboards",
  "/services/web-development",
  "/services/mobile-app-development",
  "/build",
  "/contact-us",
];

const STATUS_STYLE: Record<TopicStatus, string> = {
  Queued: "bg-muted/40 text-muted-foreground border-border",
  Generating: "bg-blue-50 dark:bg-blue-400/10 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-400/20",
  Drafted: "bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-400/20",
  Failed: "bg-red-50 dark:bg-red-400/10 text-red-600 dark:text-red-300 border-red-100 dark:border-red-400/20",
};

export function BlogTopicsManager() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const roleSlug = pathname.split("/")[1];
  const domain = params.domain as string;
  const basePath = `/${roleSlug}/content/${domain}`;

  const [topics, setTopics] = useState<BlogTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"closed" | "single" | "bulk">("closed");
  const [form, setForm] = useState(EMPTY);
  const [bulkText, setBulkText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTopics = useCallback(async () => {
    try {
      setTopics(await apiFetch<BlogTopic[]>(`/content/topics?domain=${domain}`));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [domain]);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  // Poll while anything is generating — a draft with images takes 1-3 minutes.
  const anyGenerating = topics.some((t) => t.status === "Generating");
  useEffect(() => {
    if (!anyGenerating) return;
    const t = setInterval(fetchTopics, 5000);
    return () => clearInterval(t);
  }, [anyGenerating, fetchTopics]);

  const addSingle = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await apiFetch(`/content/topics?domain=${domain}`, { method: "POST", body: JSON.stringify(form) });
      setForm(EMPTY);
      setMode("closed");
      fetchTopics();
    } catch (err: any) {
      alertDialog(err.message || "Could not add topic");
    } finally {
      setSaving(false);
    }
  };

  // One topic per line; "Title | search phrase" sets the keyword too.
  const addBulk = async () => {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setSaving(true);
    try {
      const payload = lines.map((line) => {
        const [title, keyword] = line.split("|").map((s) => s.trim());
        return { title, keyword: keyword || null };
      });
      await apiFetch(`/content/topics?domain=${domain}`, { method: "POST", body: JSON.stringify({ topics: payload }) });
      setBulkText("");
      setMode("closed");
      fetchTopics();
    } catch (err: any) {
      alertDialog(err.message || "Could not add topics");
    } finally {
      setSaving(false);
    }
  };

  const generate = async (topic: BlogTopic) => {
    if (topic.status === "Drafted" && !(await confirmDialog("This topic already has a draft. Generate another one?"))) return;
    try {
      await apiFetch(`/content/topics/${topic.id}/generate`, { method: "POST" });
      fetchTopics();
    } catch (err: any) {
      alertDialog(err.message || "Could not start generation");
    }
  };

  const remove = async (topic: BlogTopic) => {
    if (!(await confirmDialog(`Delete the topic "${topic.title}"? A generated draft is kept.`))) return;
    try {
      await apiFetch(`/content/topics/${topic.id}`, { method: "DELETE" });
      fetchTopics();
    } catch {
      alertDialog("Delete failed");
    }
  };

  const input = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring";

  return (
    <main
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden glass-panel",
        isSubNavExpanded ? "rounded-r-xl" : "rounded-xl"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <SubNavToggle />
          <div>
            <h1 className="text-base font-semibold tracking-tight text-foreground">AI Writer</h1>
            <p className="text-xs text-muted-foreground">Queue topics, generate a researched draft, review it in the editor, then publish.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(mode === "bulk" ? "closed" : "bulk")}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/85 hover:bg-muted"
          >
            Bulk add
          </button>
          <button
            onClick={() => setMode(mode === "single" ? "closed" : "single")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            New topic <TbPlus size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {mode === "single" && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <input className={input} placeholder="Working title, e.g. How much does an MVP cost in India in 2026?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className={input} placeholder="Target search phrase, e.g. mvp development cost india" value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} />
              <input className={input} list="ai-writer-target-pages" placeholder="Link the CTA to, e.g. /services/mvp-development" value={form.targetPage} onChange={(e) => setForm({ ...form, targetPage: e.target.value })} />
              <datalist id="ai-writer-target-pages">
                {TARGET_PAGES.map((p) => <option key={p} value={p} />)}
              </datalist>
            </div>
            <input className={input} placeholder="Reader (optional), e.g. non-technical founder with a seed budget" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
            <textarea
              className={cn(input, "min-h-[96px]")}
              placeholder="Your first-hand notes (recommended): real numbers, what you saw on projects, opinions. This is what makes the post read like you and rank."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-foreground/85">
                <input type="checkbox" checked={form.withImages} onChange={(e) => setForm({ ...form, withImages: e.target.checked })} />
                Generate cover and inline images with AI (otherwise add/upload them in the editor)
              </label>
              <div className="flex gap-2">
                <button onClick={() => setMode("closed")} className="rounded-lg px-3 py-1.5 text-xs text-foreground/85 hover:bg-muted">Cancel</button>
                <button onClick={addSingle} disabled={saving || !form.title.trim()} className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">
                  {saving ? "Adding…" : "Add topic"}
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === "bulk" && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <textarea
              className={cn(input, "min-h-[140px] font-mono text-xs")}
              placeholder={"One topic per line. Optionally add the search phrase after a |\nHow much does an MVP cost in India? | mvp development cost india\nNo-code vs custom MVP | no code vs custom mvp"}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setMode("closed")} className="rounded-lg px-3 py-1.5 text-xs text-foreground/85 hover:bg-muted">Cancel</button>
              <button onClick={addBulk} disabled={saving || !bulkText.trim()} className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">
                {saving ? "Adding…" : `Add ${bulkText.split("\n").filter((l) => l.trim()).length || ""} topics`}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />)
        ) : topics.length === 0 ? (
          <div className="py-20 text-center text-sm text-muted-foreground">No topics yet. Add one, or bulk-add a list.</div>
        ) : (
          topics.map((topic) => (
            <div key={topic.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-foreground">{topic.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest", STATUS_STYLE[topic.status])}>
                      {topic.status === "Generating" ? "Generating…" : topic.status}
                    </span>
                    {topic.keyword && <span>🔎 {topic.keyword}</span>}
                    {topic.targetPage && <span>→ {topic.targetPage}</span>}
                    {topic.withImages && <span className="inline-flex items-center gap-1"><TbPhoto size={12} /> AI images</span>}
                    {!topic.notes && topic.status === "Queued" && <span className="text-amber-600 dark:text-amber-300">No first-hand notes</span>}
                  </div>
                  {topic.error && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-red-600 dark:text-red-300">
                      <TbAlertTriangle size={14} className="mt-0.5 shrink-0" /> {topic.error}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {topic.blogId && (
                    <button
                      onClick={() => router.push(`${basePath}/blogs/${topic.blogId}`)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/85 hover:bg-muted"
                    >
                      <TbPencil size={14} /> Review draft
                    </button>
                  )}
                  <button
                    onClick={() => generate(topic)}
                    disabled={topic.status === "Generating"}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    {topic.status === "Generating" ? (
                      <><TbLoader size={14} className="animate-spin" /> Writing…</>
                    ) : topic.status === "Drafted" || topic.status === "Failed" ? (
                      <><TbRefresh size={14} /> Regenerate</>
                    ) : (
                      <><TbSparkles size={14} /> Generate</>
                    )}
                  </button>
                  <button onClick={() => remove(topic)} className="rounded p-1.5 text-muted-foreground/70 hover:text-red-600" title="Delete topic">
                    <TbTrash size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
