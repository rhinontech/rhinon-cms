"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { LetterTemplate } from "@/types/letterBlocks";

// Shared "create a new offer letter template" dialog — used from both the
// Settings template editor and the create-member form's template picker
// (POST /letter-templates always creates category "offer_letter"; NDA has no
// create/duplicate UI, per product decision to keep it a single template).
export function NewTemplateDialog({
  existing,
  onClose,
  onCreated,
}: {
  existing: { key: string; title: string }[];
  onClose: () => void;
  onCreated: (key: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [cloneFromKey, setCloneFromKey] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const created = await apiFetch<LetterTemplate>("/letter-templates", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), cloneFromKey: cloneFromKey || undefined }),
      });
      onCreated(created.key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create this template.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-sm font-semibold">New offer letter template</h2>
        <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Name</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Offer Letter — Contractor"
          className="mb-3 w-full rounded-md border border-border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-border"
        />
        <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Start from</label>
        <select
          value={cloneFromKey}
          onChange={(e) => setCloneFromKey(e.target.value)}
          className="mb-4 w-full rounded-md border border-border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-border"
        >
          <option value="">Blank template</option>
          {existing.map((s) => (
            <option key={s.key} value={s.key}>
              Duplicate &quot;{s.title}&quot;
            </option>
          ))}
        </select>
        {error && <p className="mb-3 text-[11px] text-red-600 dark:text-red-300">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted">
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !title.trim()}
            onClick={submit}
            className="rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
