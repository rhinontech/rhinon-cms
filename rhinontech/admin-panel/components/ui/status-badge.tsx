import { cn } from "@/lib/utils";

/**
 * Status as a dot and plain text ("● In progress"), from five semantic tones.
 * Colour carries meaning only here, so every status in the app looks the same
 * (docs/UI_UX_DESIGN_AUDIT.md D2). `strong` is for the few states that need
 * alarm (overdue, failed): a tinted pill instead of a dot.
 */
export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

const DOT: Record<StatusTone, string> = {
  neutral: "bg-muted-foreground/60",
  info: "bg-sky-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

const STRONG: Record<StatusTone, string> = {
  neutral: "bg-muted text-foreground/80",
  info: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-500/12 text-amber-800 dark:text-amber-300",
  danger: "bg-red-500/10 text-red-700 dark:text-red-300",
};

export function StatusBadge({ tone = "neutral", strong = false, children, className }: { tone?: StatusTone; strong?: boolean; children: React.ReactNode; className?: string }) {
  if (strong) {
    return <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium", STRONG[tone], className)}>{children}</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-foreground/80", className)}>
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT[tone])} aria-hidden />
      {children}
    </span>
  );
}
