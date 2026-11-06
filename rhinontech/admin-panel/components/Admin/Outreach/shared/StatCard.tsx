"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useModuleTone } from "@/components/Admin/Common/useModuleTone";

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
  const tone = useModuleTone();
  return (
    <div className={cn("rounded-xl glass-card px-4 py-3.5", className)}>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            {icon && (
              <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${tone}1f`, color: tone }}>
                {icon}
              </span>
            )}
          </div>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</div>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </>
      )}
    </div>
  );
}
