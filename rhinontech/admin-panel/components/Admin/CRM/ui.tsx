"use client";

import { cn } from "@/lib/utils";
import type { LifecycleStage, StageType, LeadStatus } from "./types";

/* ──────────────────────────────────────────────────────────────
   Formatting
   ────────────────────────────────────────────────────────────── */

/** Indian grouping (lakh/crore) for INR, plain compact grouping otherwise. */
export function formatMoney(value: string | number | null | undefined, currency = "INR"): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "—";
  const locale = currency === "INR" ? "en-IN" : "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: Math.abs(n) >= 1_00_000 ? "compact" : "standard",
      maximumFractionDigits: Math.abs(n) >= 1_00_000 ? 1 : 0,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString(locale)}`;
  }
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function initials(name: string | null | undefined): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/* ──────────────────────────────────────────────────────────────
   Atoms
   ────────────────────────────────────────────────────────────── */

/** Deterministic tint per name, so the same person is always the same colour. */
const AVATAR_TINTS = [
  "bg-blue-100 dark:bg-blue-400/15 text-blue-700 dark:text-blue-300",
  "bg-violet-100 dark:bg-violet-400/15 text-violet-700 dark:text-violet-300",
  "bg-emerald-100 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300",
  "bg-amber-100 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300",
  "bg-rose-100 dark:bg-rose-400/15 text-rose-700 dark:text-rose-300",
  "bg-cyan-100 dark:bg-cyan-400/15 text-cyan-700 dark:text-cyan-300",
];

export function Avatar({ name, size = 20 }: { name: string | null | undefined; size?: number }) {
  const label = initials(name);
  let hash = 0;
  for (const ch of label) hash = (hash + ch.charCodeAt(0)) % AVATAR_TINTS.length;
  return (
    <span
      title={name || "Unassigned"}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-tight",
        name ? AVATAR_TINTS[hash] : "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </span>
  );
}

/**
 * Lifecycle is the human funnel, so it gets real colour. Two terminal states
 * read differently on purpose: Customer wins, Unqualified recedes.
 */
const LIFECYCLE_TINT: Record<LifecycleStage, string> = {
  New: "bg-muted text-foreground/70 ring-border",
  Contacted: "bg-blue-50 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300 ring-blue-200",
  Engaged: "bg-violet-50 dark:bg-violet-400/10 text-violet-700 dark:text-violet-300 ring-violet-200",
  Qualified: "bg-amber-50 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300 ring-amber-200",
  Unqualified: "bg-muted/40 text-muted-foreground ring-border",
  Customer: "bg-emerald-50 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-300 ring-emerald-200",
};

export function LifecycleBadge({ stage, className }: { stage: LifecycleStage; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        LIFECYCLE_TINT[stage] || LIFECYCLE_TINT.New,
        className
      )}
    >
      {stage}
    </span>
  );
}

/**
 * Outreach status is machine state, not a sales signal — deliberately rendered
 * as quiet grey text so it never competes with lifecycle for attention.
 */
export function OutreachStatus({ status }: { status: LeadStatus }) {
  const muted = status === "Bounced" || status === "Unsubscribed";
  return (
    <span
      title={`Outreach engine state: ${status}`}
      className={cn("text-[11px] tabular-nums", muted ? "text-rose-400" : "text-muted-foreground")}
    >
      {status}
    </span>
  );
}

export function StageDot({ color, type }: { color?: string | null; type?: StageType }) {
  const fallback = type === "Won" ? "#22c55e" : type === "Lost" ? "#ef4444" : "#94a3b8";
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: color || fallback }}
    />
  );
}

/* ──────────────────────────────────────────────────────────────
   Dense table primitives
   ────────────────────────────────────────────────────────────── */

export function TableShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-lg glass-card", className)}>
      <div className="min-w-full">{children}</div>
    </div>
  );
}

export function HeaderRow({ cols, children }: { cols: string; children: React.ReactNode }) {
  return (
    <div
      style={{ gridTemplateColumns: cols }}
      className="sticky top-0 z-10 grid items-center gap-3 border-b border-border/70 glass-thead px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
    >
      {children}
    </div>
  );
}

export function DataRow({
  cols,
  selected,
  onClick,
  children,
}: {
  cols: string;
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      style={{ gridTemplateColumns: cols }}
      className={cn(
        // 36px: dense enough to scan a few hundred rows, tall enough that the
        // two-line lead cell isn't touching its own row borders.
        "grid min-h-9 items-center gap-3 border-b border-border px-3 text-[13px] transition-colors",
        onClick && "cursor-pointer",
        selected ? "bg-blue-50/70 dark:bg-blue-400/10" : "hover:bg-muted/40"
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {hint && <p className="max-w-sm text-xs text-muted-foreground">{hint}</p>}
      {action}
    </div>
  );
}

export function SkeletonRows({ count = 8, cols }: { count?: number; cols: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{ gridTemplateColumns: cols }}
          className="grid min-h-9 items-center gap-3 border-b border-border px-3"
        >
          <div className="h-2.5 w-full max-w-[70%] animate-pulse rounded bg-muted" />
        </div>
      ))}
    </>
  );
}

/** Compact toolbar button, sized to sit inline with the dense rows. */
export function TBtn({
  children,
  onClick,
  variant = "ghost",
  disabled,
  title,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "ghost" | "solid" | "danger";
  disabled?: boolean;
  title?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
        variant === "solid" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "ghost" && "border border-border bg-card/70 text-foreground/85 hover:bg-muted",
        variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700"
      )}
    >
      {children}
    </button>
  );
}

export function Pagination({
  offset,
  limit,
  count,
  onChange,
}: {
  offset: number;
  limit: number;
  count: number;
  onChange: (offset: number) => void;
}) {
  if (count <= limit) return null;
  const from = count === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, count);
  return (
    <div className="flex items-center justify-between px-1 py-2 text-xs text-muted-foreground">
      <span className="tabular-nums">
        {from}–{to} of {count.toLocaleString("en-IN")}
      </span>
      <div className="flex items-center gap-1.5">
        <TBtn onClick={() => onChange(Math.max(0, offset - limit))} disabled={offset === 0}>
          Previous
        </TBtn>
        <TBtn onClick={() => onChange(offset + limit)} disabled={to >= count}>
          Next
        </TBtn>
      </div>
    </div>
  );
}
