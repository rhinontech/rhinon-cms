import { cn } from "@/lib/utils";

/**
 * The one page title (docs/UI_UX_DESIGN_AUDIT.md D3): every module's heading
 * uses the same size, weight, spacing and action placement.
 */
export function PageHeader({ title, description, actions, leading, className }: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Something before the title, e.g. the sub-nav toggle on phones. */
  leading?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-2.5", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {leading}
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight text-foreground">{title}</h1>
          {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
