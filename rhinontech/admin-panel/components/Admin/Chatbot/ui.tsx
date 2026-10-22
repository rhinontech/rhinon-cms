"use client";

import { cn } from "@/lib/utils";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";

/**
 * The chatbot module's own building blocks. One look across Overview, Live
 * visitors, Live chats, Training, Appearance and Forms: a quiet header, roomy
 * cards, tinted icon chips, and the bot's own colour as the accent where it
 * helps (avatars, progress). Built on the admin's glass tokens so it sits in
 * the rest of the app in light and dark.
 */

export function PageShell({
  title,
  subtitle,
  actions,
  children,
  width = "default",
  flush = false,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  width?: "default" | "wide" | "full";
  /** Children manage their own scrolling and padding (split-pane screens). */
  flush?: boolean;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-r-xl glass-panel">
      <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-border/70 px-5 py-3 glass-header">
        <SubNavToggle />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      {flush ? (
        <div className="min-h-0 flex-1">{children}</div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <div
            className={cn(
              "mx-auto flex flex-col gap-5 p-5 sm:p-7",
              width === "default" && "max-w-5xl",
              width === "wide" && "max-w-7xl",
              width === "full" && "max-w-none"
            )}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function Panel({
  title,
  description,
  icon,
  actions,
  children,
  className,
  padded = true,
  tone,
  testId,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  padded?: boolean;
  tone?: "danger";
  testId?: string;
}) {
  return (
    <section
      data-testid={testId}
      className={cn(
        "overflow-hidden rounded-2xl border bg-[var(--glass-card-solid-bg)] shadow-[0_1px_2px_rgb(0_0_0/0.04)]",
        tone === "danger" ? "border-red-300/60 dark:border-red-400/25" : "border-[var(--glass-card-border)]",
        className
      )}
    >
      {(title || actions) && (
        <div className={cn("flex items-start gap-3", padded ? "px-6 pt-5" : "border-b border-border/70 px-5 py-4")}>
          {icon && <IconChip>{icon}</IconChip>}
          <div className="min-w-0 flex-1">
            {title && <h2 className={cn("text-sm font-semibold text-foreground", tone === "danger" && "text-red-600 dark:text-red-400")}>{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {children !== undefined && <div className={cn(padded && "px-6 pb-6", padded && (title || actions) ? "pt-4" : padded ? "pt-6" : "")}>{children}</div>}
    </section>
  );
}

export function IconChip({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", TONE_CHIP[tone], className)}>{children}</span>;
}

type Tone = "neutral" | "green" | "amber" | "blue" | "violet" | "red";

const TONE_CHIP: Record<Tone, string> = {
  neutral: "bg-muted text-foreground/70",
  green: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/14 text-amber-600 dark:text-amber-400",
  blue: "bg-blue-500/12 text-blue-600 dark:text-blue-400",
  violet: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
  red: "bg-red-500/12 text-red-600 dark:text-red-400",
};

export function Stat({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  testId,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ReactNode;
  tone?: Tone;
  testId?: string;
}) {
  return (
    <div data-testid={testId} className="flex items-start gap-3 rounded-2xl border border-[var(--glass-card-border)] bg-[var(--glass-card-solid-bg)] p-4">
      <IconChip tone={tone}>{icon}</IconChip>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
        {hint && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-12 text-center", className)}>
      <span className="mb-1 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">{icon}</span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {body && <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Initials on a colour derived from the seed, so the same visitor is always the same colour. */
export function Avatar({ name, seed, size = "md", className }: { name: string; seed: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const initials =
    name
      .replace(/@.*/, "")
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const hue = Math.abs(hash) % 360;
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white",
        size === "sm" && "size-7 text-[10px]",
        size === "md" && "size-9 text-xs",
        size === "lg" && "size-12 text-sm",
        className
      )}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 65% 55%), hsl(${(hue + 40) % 360} 65% 45%))` }}
    >
      {initials}
    </span>
  );
}

export function StatusDot({ online, className }: { online: boolean; className?: string }) {
  return (
    <span className={cn("relative inline-flex size-2.5", className)} aria-label={online ? "Online" : "Offline"}>
      {online && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
      <span className={cn("relative inline-flex size-2.5 rounded-full ring-2 ring-background", online ? "bg-emerald-500" : "bg-muted-foreground/40")} />
    </span>
  );
}

export function Chip({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium", TONE_CHIP[tone], className)}>{children}</span>;
}

/** Segmented control for 2–5 options. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = "md",
  testIdPrefix,
}: {
  value: T;
  options: { value: T; label: React.ReactNode; count?: number }[];
  onChange: (v: T) => void;
  size?: "sm" | "md";
  testIdPrefix?: string;
}) {
  return (
    <div className="inline-flex rounded-xl bg-muted p-1" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          data-testid={testIdPrefix ? `${testIdPrefix}-${o.value}` : undefined}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg font-medium transition-all",
            size === "md" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs",
            value === o.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span className={cn("rounded-md px-1.5 text-[10px] tabular-nums", value === o.value ? "bg-muted" : "bg-background/60")}>{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/** "Started 4 min ago" style durations. */
export function since(iso: string | null | undefined): string {
  if (!iso) return "—";
  const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ${m % 60} min`;
  return `${Math.floor(h / 24)} d`;
}

/** "rhinonlabs.com/pricing" — the site and path, without the scheme. */
export function pageLabel(url: string | null | undefined): string {
  if (!url) return "—";
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return url;
  }
}

/** A page path without the site's origin, for compact display. */
export function shortPath(url: string | null | undefined): string {
  if (!url) return "—";
  try {
    const u = new URL(url);
    return `${u.pathname}${u.search}` || "/";
  } catch {
    return url;
  }
}
