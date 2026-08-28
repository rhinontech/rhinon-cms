"use client";

import { useCallback, useEffect, useState } from "react";
import { TbMail, TbEye, TbPointer, TbRefresh } from "react-icons/tb";
import { apiFetch } from "@/lib/api";

interface StepStat {
  nodeId: string;
  step: number;
  label: string;
  subject: string | null;
  sent: number;
  opened: number;
  clicked: number;
  openRate: number | null;
  clickRate: number | null;
}

interface StatsResponse {
  workflowId: string;
  totals: Record<string, number>;
  steps: StepStat[];
}

/**
 * Per-step sequence performance.
 *
 * Rates are against sends, not enrolments — a step nobody has reached yet reads
 * as "no data" rather than as 0% performance. Bars use a single hue because the
 * step label already carries identity; only magnitude is being compared.
 */
export function SequenceStats({ workflowId }: { workflowId: string }) {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await apiFetch<StatsResponse>(`/workflows/${workflowId}/stats`));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="h-28 animate-pulse rounded-xl bg-muted" />;
  if (!data || data.steps.length === 0) return null;

  const maxSent = Math.max(...data.steps.map((s) => s.sent), 1);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Step performance</h3>
          <p className="text-xs text-muted-foreground">Open and click rates are measured against sends.</p>
        </div>
        <button onClick={load} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" title="Refresh">
          <TbRefresh size={15} />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-4 border-b border-border pb-3">
        <Total icon={<TbMail size={14} />} label="Sent" value={data.totals.sent || 0} />
        <Total icon={<TbEye size={14} />} label="Opened" value={data.totals.opened || 0} />
        <Total icon={<TbPointer size={14} />} label="Clicked" value={data.totals.clicked || 0} />
        <Total label="Enrolled" value={data.totals.enrollments || 0} />
        <Total label="Cancelled" value={data.totals.cancelled || 0} />
      </div>

      <ul className="space-y-2.5">
        {data.steps.map((step) => (
          <li key={step.nodeId}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-xs font-medium text-foreground">
                <span className="text-muted-foreground">{step.step}.</span> {step.subject || step.label}
              </span>
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {step.sent} sent
                {step.openRate != null && <span className="ml-2">{step.openRate}% opened</span>}
                {step.clickRate != null && <span className="ml-2">{step.clickRate}% clicked</span>}
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded bg-muted">
              {/* Sends set the bar's extent; opens and clicks are nested shares
                  of it, so the three read as one funnel rather than three scales. */}
              <div
                className="absolute inset-y-0 left-0 rounded"
                style={{ width: `${(step.sent / maxSent) * 100}%`, background: "#cfe0f6" }}
                title={`${step.sent} sent`}
              />
              <div
                className="absolute inset-y-0 left-0 rounded"
                style={{ width: `${(step.opened / maxSent) * 100}%`, background: "#7fb0ea" }}
                title={`${step.opened} opened`}
              />
              <div
                className="absolute inset-y-0 left-0 rounded"
                style={{ width: `${(step.clicked / maxSent) * 100}%`, background: "#2a78d6" }}
                title={`${step.clicked} clicked`}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        <Key color="#cfe0f6" label="Sent" />
        <Key color="#7fb0ea" label="Opened" />
        <Key color="#2a78d6" label="Clicked" />
      </div>
    </div>
  );
}

function Total({ icon, label, value }: { icon?: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

function Key({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
