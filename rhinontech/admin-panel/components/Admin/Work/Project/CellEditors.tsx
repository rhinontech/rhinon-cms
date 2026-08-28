"use client";

import { useEffect, useRef, useState } from "react";
import { TbPencil } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import type { FieldDefinition, PersonOption } from "./types";

/** Commits on blur or Enter, reverts on Escape — the spreadsheet convention. */
export function TextCell({
  value, onCommit, className, placeholder, type = "text",
}: {
  value: string;
  onCommit: (v: string) => void;
  className?: string;
  placeholder?: string;
  type?: "text" | "number" | "date";
}) {
  const [draft, setDraft] = useState(value);
  const dirty = useRef(false);

  // Re-sync when the row is replaced by a refetch, but never clobber a live edit.
  useEffect(() => { if (!dirty.current) setDraft(value); }, [value]);

  return (
    <input
      type={type}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => { dirty.current = true; setDraft(e.target.value); }}
      onBlur={() => { dirty.current = false; if (draft !== value) onCommit(draft); }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") { dirty.current = false; setDraft(value); (e.target as HTMLInputElement).blur(); }
      }}
      className={cn(
        "w-full min-w-0 truncate rounded border border-transparent bg-transparent px-1.5 py-1 text-sm outline-none",
        "hover:border-stone-200 focus:border-blue-500 focus:bg-white",
        className
      )}
    />
  );
}

/**
 * The task name cell.
 *
 * Clicking the name OPENS the task — that is the primary action, and making the
 * cell an input by default hid it behind a hover icon. Renaming is still inline,
 * but it needs an explicit gesture: double-click, or the pencil on hover.
 */
export function TitleCell({
  title, onOpen, onRename, className,
}: {
  title: string;
  onOpen: () => void;
  onRename: (v: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  useEffect(() => { if (!editing) setDraft(title); }, [title, editing]);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== title) onRename(next);
    else setDraft(title);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(title); setEditing(false); }
        }}
        className={cn(
          "w-full min-w-0 rounded border border-blue-500 bg-white px-1.5 py-1 text-sm outline-none",
          className
        )}
      />
    );
  }

  return (
    <span className="flex min-w-0 flex-1 items-center gap-1">
      <button
        data-task-opener
        onClick={onOpen}
        onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
        title="Open task · double-click to rename"
        className={cn(
          "min-w-0 flex-1 truncate rounded border border-transparent px-1.5 py-1 text-left text-sm hover:underline",
          className
        )}
      >
        {title}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        title="Rename"
        className="shrink-0 rounded p-1 text-stone-400 opacity-0 transition hover:bg-stone-200 hover:text-stone-700 group-hover:opacity-100"
      >
        <TbPencil size={12} />
      </button>
    </span>
  );
}

export function SelectCell({
  value, options, onCommit, placeholder = "—",
}: {
  value: string;
  options: { value: string; label: string }[];
  onCommit: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onCommit(e.target.value)}
      className="w-full min-w-0 truncate rounded border border-transparent bg-transparent px-1 py-1 text-sm outline-none hover:border-stone-200 focus:border-blue-500 focus:bg-white"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

const CURRENCY = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** Renders and edits one custom-field cell according to its declared type. */
export function CustomFieldCell({
  field, value, people, onCommit,
}: {
  field: FieldDefinition;
  value: unknown;
  people: PersonOption[];
  onCommit: (v: unknown) => void;
}) {
  if (field.type === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onCommit(e.target.checked)}
        className="h-3.5 w-3.5"
      />
    );
  }

  if (field.type === "dropdown") {
    return (
      <SelectCell
        value={value == null ? "" : String(value)}
        options={(field.options ?? []).map((o) => ({ value: o, label: o }))}
        onCommit={(v) => onCommit(v || null)}
      />
    );
  }

  if (field.type === "user") {
    return (
      <SelectCell
        value={value == null ? "" : String(value)}
        options={people.map((p) => ({ value: p.id, label: p.fullName }))}
        onCommit={(v) => onCommit(v || null)}
      />
    );
  }

  if (field.type === "date") {
    return (
      <DatePicker
        variant="cell"
        ariaLabel={field.name}
        value={value ? String(value) : null}
        onChange={(v) => onCommit(v)}
      />
    );
  }

  if (field.type === "number" || field.type === "currency" || field.type === "percent") {
    const num = value == null || value === "" ? "" : String(value);
    return (
      <TextCell
        type="number"
        value={num}
        onCommit={(v) => onCommit(v === "" ? null : Number(v))}
        // Formatting is display-only; the stored value stays a raw number.
        className={field.type === "currency" ? "text-right" : undefined}
      />
    );
  }

  return <TextCell value={value == null ? "" : String(value)} onCommit={(v) => onCommit(v || null)} />;
}

/** Read-only pretty form used when a numeric cell isn't focused. */
export function formatFieldValue(field: FieldDefinition, value: unknown): string {
  if (value == null || value === "") return "";
  if (field.type === "currency") return CURRENCY.format(Number(value));
  if (field.type === "percent") return `${value}%`;
  return String(value);
}
