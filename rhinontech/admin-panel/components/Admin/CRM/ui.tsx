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
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
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
        name ? AVATAR_TINTS[hash] : "bg-stone-100 text-stone-400"
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
  New: "bg-stone-100 text-stone-600 ring-stone-200",
  Contacted: "bg-blue-50 text-blue-700 ring-blue-200",
  Engaged: "bg-violet-50 text-violet-700 ring-violet-200",
  Qualified: "bg-amber-50 text-amber-700 ring-amber-200",
  Unqualified: "bg-stone-50 text-stone-400 ring-stone-200",
  Customer: "bg-emerald-50 text-emerald-700 ring-emerald-200",
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
      className={cn("text-[11px] tabular-nums", muted ? "text-rose-400" : "text-stone-400")}
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
      className="sticky top-0 z-10 grid items-center gap-3 border-b border-stone-200/70 glass-thead px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500"
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
        "grid min-h-9 items-center gap-3 border-b border-stone-100 px-3 text-[13px] transition-colors",
        onClick && "cursor-pointer",
        selected ? "bg-blue-50/70" : "hover:bg-stone-50/80"
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
      <p className="text-sm font-medium text-stone-500">{title}</p>
      {hint && <p className="max-w-sm text-xs text-stone-400">{hint}</p>}
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
          className="grid min-h-9 items-center gap-3 border-b border-stone-100 px-3"
        >
          <div className="h-2.5 w-full max-w-[70%] animate-pulse rounded bg-stone-100" />
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
        variant === "solid" && "bg-stone-900 text-white hover:bg-stone-800",
        variant === "ghost" && "border border-stone-200 bg-white/70 text-stone-700 hover:bg-stone-100",
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
    <div className="flex items-center justify-between px-1 py-2 text-xs text-stone-500">
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
