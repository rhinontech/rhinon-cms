"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiUpload } from "@/lib/api";
import type { SectionId } from "./eventForm";

/** One editor section: a glass card with a title, a hint and an anchor for the side nav. */
export function SectionCard({
  id,
  icon: Icon,
  title,
  hint,
  action,
  children,
}: {
  id: SectionId;
  icon: typeof Plus;
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={`section-${id}`} className="scroll-mt-24 glass-card rounded-2xl p-6 sm:p-7">
      <header className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center size-9 shrink-0 rounded-xl bg-primary/10 text-primary dark:bg-primary/15">
            <Icon className="size-[18px]" aria-hidden />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
            {hint ? <p className="mt-0.5 text-[13px] text-muted-foreground leading-relaxed">{hint}</p> : null}
          </div>
        </div>
        {action}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label htmlFor={htmlFor} className="text-[13px] font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-[12px] font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-muted-foreground leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
}

/** Up / down / remove controls shared by every repeatable row. */
export function RowControls({
  index,
  count,
  onMove,
  onRemove,
  label,
}: {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <Button type="button" variant="ghost" size="icon" className="size-8" disabled={index === 0}
        onClick={() => onMove(index, index - 1)} aria-label={`Move ${label} up`}>
        <ArrowUp className="size-3.5" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="size-8" disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)} aria-label={`Move ${label} down`}>
        <ArrowDown className="size-3.5" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(index)} aria-label={`Remove ${label}`}>
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

export const move = <T,>(items: T[], from: number, to: number): T[] => {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/** An ordered list of one-line strings — outcomes, for instance. */
export function StringListField({
  values,
  onChange,
  placeholder,
  addLabel,
  itemLabel,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  addLabel: string;
  itemLabel: string;
}) {
  return (
    <div className="space-y-2">
      {values.map((value, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="grid place-items-center size-6 shrink-0 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
            {index + 1}
          </span>
          <Input
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(values.map((v, i) => (i === index ? e.target.value : v)))}
          />
          <RowControls
            index={index}
            count={values.length}
            label={itemLabel}
            onMove={(f, t) => onChange(move(values, f, t))}
            onRemove={(i) => onChange(values.filter((_, n) => n !== i))}
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => onChange([...values, ""])}>
        <Plus className="size-3.5" /> {addLabel}
      </Button>
    </div>
  );
}

/** Type and press Enter (or comma) to add a chip. */
export function ChipsField({
  id,
  values,
  onChange,
  placeholder,
}: {
  id?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const value = draft.trim().replace(/,$/, "");
    if (value && !values.some((v) => v.toLowerCase() === value.toLowerCase())) onChange([...values, value]);
    setDraft("");
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  };
  return (
    <div className="rounded-md border border-input bg-transparent dark:bg-input/30 px-2 py-1.5 flex flex-wrap items-center gap-1.5 focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] transition-[color,box-shadow]">
      {values.map((value) => (
        <span key={value} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[12.5px] font-medium">
          {value}
          <button type="button" onClick={() => onChange(values.filter((v) => v !== value))}
            className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${value}`}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
        placeholder={values.length ? "" : placeholder}
        className="flex-1 min-w-[160px] bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

/**
 * Upload or paste an image URL, with a preview. Uploads go through the events
 * endpoint, which stores them in the public content bucket.
 */
export function ImageField({
  value,
  onChange,
  aspect = "aspect-[16/9]",
  compact = false,
  label = "image",
}: {
  value: string;
  onChange: (url: string) => void;
  aspect?: string;
  compact?: boolean;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const res = await apiUpload<{ url?: string; fileUrl?: string }>("/events/upload", file, "file");
      const url = res.url || res.fileUrl;
      if (url) onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };

  const picker = (
    <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
  );

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {picker}
        <button type="button" onClick={() => input.current?.click()}
          className="relative size-14 shrink-0 rounded-xl overflow-hidden border border-dashed border-border bg-muted/40 grid place-items-center text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors"
          aria-label={`Upload ${label}`}>
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <ImagePlus className="size-4" />
          )}
        </button>
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Photo URL, or click the tile to upload" className="text-[13px]" />
        {error ? <p className="text-[12px] text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {picker}
      <div className={`relative ${aspect} w-full max-h-[300px] rounded-xl overflow-hidden border border-dashed border-border bg-muted/30`}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <button type="button" onClick={() => input.current?.click()}
            className="absolute inset-0 grid place-items-center text-muted-foreground hover:text-primary transition-colors">
            <span className="flex flex-col items-center gap-2 text-[13px] font-medium">
              <ImagePlus className="size-6" />
              Upload a {label}
              <span className="text-[12px] font-normal">JPG or PNG, 1600 × 900 works best</span>
            </span>
          </button>
        )}
        {uploading ? (
          <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : null}
        {value ? (
          <div className="absolute top-3 right-3 flex gap-2">
            <Button type="button" size="sm" variant="secondary" className="shadow-sm" onClick={() => input.current?.click()}>
              Replace
            </Button>
            <Button type="button" size="sm" variant="secondary" className="shadow-sm" onClick={() => onChange("")}>
              Remove
            </Button>
          </div>
        ) : null}
      </div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="…or paste an image URL" />
      {error ? <p className="text-[12px] text-destructive">{error}</p> : null}
    </div>
  );
}
