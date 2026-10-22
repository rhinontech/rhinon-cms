"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TbCheck, TbCopy } from "react-icons/tb";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { cn } from "@/lib/utils";

/** The frame every settings screen shares: sticky title bar, scrolling body. */
export function SettingsFrame({
  title,
  description,
  actions,
  children,
  wide,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** Let the body use the full panel width instead of a readable column. */
  wide?: boolean;
}) {
  return (
    <div className="flex flex-col h-full glass-panel rounded-r-xl overflow-hidden">
      <div className="sticky top-0 z-10 flex items-center gap-4 h-16 px-5 border-b border-border glass-header">
        <SubNavToggle />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
          {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className={cn("mx-auto flex flex-col gap-4", wide ? "max-w-7xl" : "max-w-4xl")}>{children}</div>
      </div>
    </div>
  );
}

export function SettingsCard({
  title,
  description,
  actions,
  children,
  tone,
  testId,
}: {
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  tone?: "danger";
  testId?: string;
}) {
  return (
    <section
      data-testid={testId}
      className={cn("rounded-xl glass-card p-5", tone === "danger" && "border-red-300/60 dark:border-red-400/30")}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h3 className={cn("text-sm font-semibold", tone === "danger" ? "text-red-700 dark:text-red-300" : "text-foreground")}>
                {title}
              </h3>
            )}
            {description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children && <div className={cn(title || actions ? "mt-4" : "")}>{children}</div>}
    </section>
  );
}

export type PillTone = "green" | "amber" | "red" | "blue" | "gray";

const PILL: Record<PillTone, string> = {
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  red: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  gray: "bg-muted text-muted-foreground",
};

export function Pill({ tone = "gray", children, testId }: { tone?: PillTone; children: React.ReactNode; testId?: string }) {
  return (
    <span data-testid={testId} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap", PILL[tone])}>
      {children}
    </span>
  );
}

/** A labelled usage bar: green until 80%, amber until the limit, red at it. `limit: null` is unlimited. */
export function Meter({ label, used, limit, hint, testId }: { label: string; used: number; limit: number | null; hint?: string; testId?: string }) {
  const pct = limit === null || limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const tone = limit !== null && used >= limit ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div data-testid={testId}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">{used.toLocaleString()}</span>
          {limit === null ? " · Unlimited" : ` / ${limit.toLocaleString()}`}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        {limit !== null && <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${pct}%` }} />}
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export async function copyText(text: string, what = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(what);
  } catch {
    toast.error("Could not copy — select the text and copy it manually.");
  }
}

export function CopyButton({ text, label = "Copy", className, testId }: { text: string; label?: string; className?: string; testId?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={async () => {
        await copyText(text, `${label === "Copy" ? "Copied" : label} to clipboard`);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted",
        className
      )}
    >
      {done ? <TbCheck size={13} className="text-emerald-600" /> : <TbCopy size={13} />}
      {done ? "Copied" : label}
    </button>
  );
}

export function Notice({ tone = "info", children, testId }: { tone?: "info" | "warning" | "danger" | "success"; children: React.ReactNode; testId?: string }) {
  const tones = {
    info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200",
    warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200",
    danger: "border-red-200 bg-red-50 text-red-800 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-200",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200",
  };
  return (
    <div data-testid={testId} className={cn("rounded-lg border px-3 py-2.5 text-sm leading-relaxed", tones[tone])}>
      {children}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)} aria-hidden />;
}

export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/60" />
      ))}
    </div>
  );
}
