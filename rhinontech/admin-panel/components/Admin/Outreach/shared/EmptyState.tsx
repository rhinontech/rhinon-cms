import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 py-16 text-center", className)}>
      {icon && <div className="mb-3 text-stone-300">{icon}</div>}
      <p className="text-sm font-semibold text-stone-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-stone-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
