import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  hint,
  loading,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: string;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl glass-panel p-5", className)}>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-stone-500">{label}</span>
            {icon && <span className="text-stone-400">{icon}</span>}
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-stone-900 tabular-nums">{value}</div>
          {hint && <p className="mt-1 text-xs text-stone-400">{hint}</p>}
        </>
      )}
    </div>
  );
}
