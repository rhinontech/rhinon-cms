"use client";

import { useEffect, useRef, useState } from "react";
import { TbFileText, TbSparkles, TbTextWrap, TbPlus, TbTrash } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { LetterBlocksView } from "@/components/Admin/People/LetterBlocksView";
import { LetterEnvelope } from "@/components/Admin/People/LetterEnvelope";
import { RewriteToolbar } from "@/components/Admin/People/RewriteToolbar";
import { NewTemplateDialog } from "@/components/Admin/People/NewTemplateDialog";
import type { LetterBlock, LetterTemplate, LetterTemplateKey } from "@/types/letterBlocks";

type TemplateSummary = Pick<LetterTemplate, "key" | "category" | "title" | "version" | "updatedAt">;

// Master-template editor for the offer letter / NDA content used across all
// future hires — separate from the per-employee overrides made in the
// create-member form's live preview (PeopleDirectory.tsx), which never touch
// this data. Reuses the same LetterBlocksView/RewriteToolbar so AI-assisted
// editing feels identical in both places. Offer letters support any number
// of named templates (new/duplicate/delete); NDA is deliberately a single
// fixed template with none of those actions.
export function SettingsLetterTemplates() {
  const [selectedKey, setSelectedKey] = useState<LetterTemplateKey | null>(null);
  const [summaries, setSummaries] = useState<TemplateSummary[]>([]);
  const [creating, setCreating] = useState(false);

  const load = () => apiFetch<TemplateSummary[]>("/letter-templates").then((rows) => {
    setSummaries(rows);
    setSelectedKey((prev) => prev ?? rows[0]?.key ?? null);
  });

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const offerTemplates = summaries.filter((s) => s.category === "offer_letter");
  const ndaTemplates = summaries.filter((s) => s.category === "nda");

  const removeTemplate = async (key: string) => {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    try {
      await apiFetch(`/letter-templates/${key}`, { method: "DELETE" });
      if (selectedKey === key) setSelectedKey(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete this template.");
    }
  };

  return (
    <div className="flex h-full glass-panel rounded-r-xl overflow-hidden">
      <aside className="w-72 shrink-0 border-r border-black/5 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center gap-3 h-16 px-4 border-b border-black/5 glass-header">
          <SubNavToggle />
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Letter Templates</h1>
            <p className="text-[11px] text-gray-500">Offer letter &amp; NDA content</p>
          </div>
        </div>
        <div className="p-2">
          <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Offer Letters</span>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            >
              <TbPlus size={13} /> New
            </button>
          </div>
          <nav className="space-y-0.5">
            {offerTemplates.map((s) => (
              <TemplateRow
                key={s.key}
                summary={s}
                selected={selectedKey === s.key}
                onSelect={() => setSelectedKey(s.key)}
                onDelete={offerTemplates.length > 1 ? () => removeTemplate(s.key) : undefined}
              />
            ))}
          </nav>

          <div className="mt-4 px-2 pb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">NDA</span>
          </div>
          <nav className="space-y-0.5">
            {ndaTemplates.map((s) => (
              <TemplateRow key={s.key} summary={s} selected={selectedKey === s.key} onSelect={() => setSelectedKey(s.key)} />
            ))}
          </nav>
        </div>
      </aside>

      {selectedKey ? (
        <TemplateEditor
          key={selectedKey}
          templateKey={selectedKey}
          onSaved={(t) => setSummaries((prev) => prev.map((s) => (s.key === t.key ? t : s)))}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-stone-400">Select a template.</div>
      )}

      {creating && (
        <NewTemplateDialog
          existing={offerTemplates}
          onClose={() => setCreating(false)}
          onCreated={async (key) => {
            setCreating(false);
            await load();
            setSelectedKey(key);
          }}
        />
      )}
    </div>
  );
}

function TemplateRow({
  summary,
  selected,
  onSelect,
  onDelete,
}: {
  summary: TemplateSummary;
  selected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-start gap-2 rounded-lg px-3 py-2.5 transition-colors",
        selected ? "bg-stone-900 text-white" : "hover:bg-stone-100 text-stone-700"
      )}
    >
      <button type="button" onClick={onSelect} className="flex flex-1 items-start gap-3 text-left min-w-0">
        <TbFileText size={16} className="mt-0.5 shrink-0 opacity-70" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{summary.title}</span>
          <span className={cn("block text-[11px]", selected ? "text-white/60" : "text-stone-400")}>
            v{summary.version} · {new Date(summary.updatedAt).toLocaleDateString()}
          </span>
        </span>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          title="Delete template"
          className={cn(
            "shrink-0 rounded p-1 opacity-0 group-hover:opacity-100",
            selected ? "hover:bg-white/10 text-white/80" : "hover:bg-stone-200 text-stone-400"
          )}
        >
          <TbTrash size={14} />
        </button>
      )}
    </div>
  );
}

function TemplateEditor({ templateKey, onSaved }: { templateKey: LetterTemplateKey; onSaved: (t: LetterTemplate) => void }) {
  const [template, setTemplate] = useState<LetterTemplate | null>(null);
  const [blocks, setBlocks] = useState<LetterBlock[]>([]);
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    setSaveMessage("");
    apiFetch<LetterTemplate>(`/letter-templates/${templateKey}`)
      .then((t) => {
        setTemplate(t);
        setBlocks(t.blocks);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load this template.");
        setLoading(false);
      });
  }, [templateKey]);

  const dirty = template ? JSON.stringify(blocks) !== JSON.stringify(template.blocks) : false;

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await apiFetch<LetterTemplate>(`/letter-templates/${templateKey}`, {
        method: "PUT",
        body: JSON.stringify({ blocks }),
      });
      setTemplate(updated);
      setBlocks(updated.blocks);
      onSaved(updated);
      setSaveMessage("Saved — future hires will use this wording.");
      setTimeout(() => setSaveMessage(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this template.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 h-16 px-5 border-b border-black/5 glass-header">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{template?.title}</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold", mode === "preview" ? "bg-white shadow-sm text-stone-900" : "text-stone-500")}
          >
            <TbSparkles size={14} /> AI select &amp; rewrite
          </button>
          <button
            type="button"
            onClick={() => setMode("edit")}
            className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold", mode === "edit" ? "bg-white shadow-sm text-stone-900" : "text-stone-500")}
          >
            <TbTextWrap size={14} /> Edit text directly
          </button>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && <span className="text-xs text-emerald-600">{saveMessage}</span>}
          {dirty && !saveMessage && <span className="text-xs text-amber-600">Unsaved changes</span>}
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={save}
            className="rounded-md bg-stone-900 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading && <div className="p-8 text-sm text-stone-400">Loading template…</div>}
        {error && <div className="p-8 text-sm text-red-500">{error}</div>}
        {!loading && !error && mode === "preview" && (
          <div className="relative" ref={containerRef}>
            <LetterEnvelope type={template?.category === "nda" ? "nda" : "offer"}>
              <LetterBlocksView blocks={blocks} />
            </LetterEnvelope>
            <RewriteToolbar
              containerRef={containerRef}
              blocks={blocks}
              onApply={(blockId, text) => setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, text } : b)))}
            />
          </div>
        )}
        {!loading && !error && mode === "edit" && (
          <div className="mx-auto max-w-3xl space-y-3 p-6">
            {blocks.map((block) =>
              block.kind === "pagebreak" ? null : (
                <div key={block.id}>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    {block.kind}
                    {"num" in block && block.num ? ` ${block.num}` : ""}
                    {"marker" in block && block.marker ? ` ${block.marker}` : ""}
                  </label>
                  <textarea
                    value={block.text}
                    onChange={(e) => {
                      const text = e.target.value;
                      setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, text } : b)));
                    }}
                    rows={block.text.length > 200 ? 4 : 2}
                    className="w-full rounded-md border border-stone-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
