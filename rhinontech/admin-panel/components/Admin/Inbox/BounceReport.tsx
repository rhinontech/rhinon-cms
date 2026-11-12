"use client";

import { useState } from "react";
import { TbAlertTriangle, TbArrowLeft, TbCheck, TbClockPause, TbCopy, TbMailOff, TbPencil, TbSend } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { fullTime, IconButton, listTime, PaneMessage, stampTime, type BouncedAddress, type BounceReport } from "./inboxShared";

type Tone = "rose" | "amber" | "slate";

const TONE_CHIP: Record<Tone, string> = {
  rose: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
  slate: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/20",
};

/** What kind of failure an address had, in words someone cleaning a list can act on. */
export function bounceKind(entry: BouncedAddress): { label: string; tone: Tone; hint: string } {
  if (entry.reason && /suppression list/i.test(entry.reason)) {
    return { label: "Suppressed", tone: "slate", hint: "Amazon SES won't send to this address because it bounced before. Take it off your lists." };
  }
  if (entry.bounced === 0) {
    return { label: "Delayed", tone: "amber", hint: "The receiving server is still retrying. It may still arrive." };
  }
  if (entry.status?.startsWith("5.")) {
    return { label: "Hard bounce", tone: "rose", hint: "Permanent: this address doesn't accept mail. Take it off your lists." };
  }
  if (entry.status?.startsWith("4.")) {
    return { label: "Soft bounce", tone: "amber", hint: "Temporary: a full mailbox, a timeout or an unreachable server. A later send may work." };
  }
  return { label: "Bounced", tone: "rose", hint: "The message couldn't be delivered." };
}

export function KindChip({ entry, className }: { entry: BouncedAddress; className?: string }) {
  const kind = bounceKind(entry);
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-1.5 py-px text-[10.5px] font-medium ring-1 ring-inset", TONE_CHIP[kind.tone], className)}>
      {kind.label}
    </span>
  );
}

export function BounceRow({ entry, selected, onSelect }: { entry: BouncedAddress; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full gap-3 rounded-lg px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
        selected ? "bg-[var(--surface-selected)] shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--brand)_18%,transparent)]" : "hover:bg-foreground/[0.04]"
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/15">
        <TbMailOff size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{entry.address}</span>
          <time className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{listTime(entry.lastNoticeAt)}</time>
        </span>
        <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span><b className="font-semibold tabular-nums text-foreground/80">{entry.sent}</b> sent</span>
          <span className="h-3 w-px bg-border" />
          <span><b className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">{entry.bounced}</b> bounced</span>
          {entry.delayed > 0 && (
            <>
              <span className="h-3 w-px bg-border" />
              <span><b className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">{entry.delayed}</b> delayed</span>
            </>
          )}
          <KindChip entry={entry} className="ml-auto" />
        </span>
      </span>
    </button>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "rose" | "amber" }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 shadow-xs">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn(
        "mt-1 text-2xl font-semibold tracking-tight tabular-nums text-foreground",
        tone === "rose" && value > 0 && "text-rose-600 dark:text-rose-400",
        tone === "amber" && value > 0 && "text-amber-600 dark:text-amber-400"
      )}>{value}</p>
    </div>
  );
}

export function BounceDetail({ entry, onBack, onCompose }: { entry: BouncedAddress; onBack: () => void; onCompose: (to: string) => void }) {
  const [copied, setCopied] = useState(false);
  const kind = bounceKind(entry);
  const history = [
    ...entry.notices.map((n) => ({ at: n.at, kind: n.action === "failed" ? ("bounced" as const) : ("delayed" as const), title: n.action === "failed" ? "Bounced" : "Delivery delayed", detail: n.reason, status: n.status })),
    ...entry.sends.map((s) => ({ at: s.at, kind: "sent" as const, title: "Sent", detail: s.subject, status: null })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(entry.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked */ }
  };

  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-5">
        <IconButton onClick={onBack} className="-ml-1 lg:hidden" aria-label="Back to list"><TbArrowLeft size={18} /></IconButton>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-[15px] font-semibold tracking-tight text-foreground">{entry.address}</h2>
            <KindChip entry={entry} />
          </div>
          <p className="truncate text-xs text-muted-foreground">{`Last bounce ${stampTime(entry.lastNoticeAt)}`}</p>
        </div>
        <Button variant="outline" size="sm" onClick={copy}>{copied ? <TbCheck /> : <TbCopy />}<span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span></Button>
        <Button variant="outline" size="sm" onClick={() => onCompose(entry.address)}><TbPencil /><span className="hidden sm:inline">Email</span></Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        <div className="mx-auto flex max-w-[760px] flex-col gap-4">
          <div className="grid grid-cols-3 gap-2.5">
            <Stat label="Times sent" value={entry.sent} />
            <Stat label="Times bounced" value={entry.bounced} tone="rose" />
            <Stat label="Delayed" value={entry.delayed} tone="amber" />
          </div>

          <section className="rounded-xl border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <TbAlertTriangle size={16} className={cn("shrink-0", kind.tone === "rose" ? "text-rose-500" : kind.tone === "amber" ? "text-amber-500" : "text-slate-500")} />
              <p className="text-sm font-semibold text-foreground">Why it came back</p>
              {entry.status && <code className="ml-auto rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">{entry.status}</code>}
            </div>
            <p className="mt-2 text-[13px] leading-6 text-foreground/85">{entry.reason || "The notice didn't say why."}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{kind.hint}</p>
          </section>

          <section>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">History</p>
            <ol className="overflow-hidden rounded-xl border bg-card shadow-xs">
              {history.map((h, i) => (
                <li key={`${h.kind}-${h.at}-${i}`} className="flex gap-3 border-b px-4 py-3 last:border-b-0">
                  <span className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    h.kind === "sent" ? "bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300"
                      : h.kind === "bounced" ? "bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300"
                        : "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300"
                  )}>
                    {h.kind === "sent" ? <TbSend size={14} /> : h.kind === "bounced" ? <TbMailOff size={14} /> : <TbClockPause size={14} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="text-[13px] font-medium text-foreground">{h.title}</p>
                      {h.status && <code className="font-mono text-[11px] text-muted-foreground">{h.status}</code>}
                      <time className="ml-auto shrink-0 text-xs text-muted-foreground" title={fullTime(h.at)}>{stampTime(h.at)}</time>
                    </div>
                    {h.detail && <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{h.detail}</p>}
                  </div>
                </li>
              ))}
            </ol>
            {entry.sent === 0 && (
              <p className="mt-2 px-1 text-xs leading-5 text-muted-foreground">
                {"No send to this address is in your Sent folder. It may have gone out from another teammate's mailbox, or before the inbox kept copies."}
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

export function BounceOverview({ report }: { report: BounceReport | null }) {
  if (!report || report.addresses.length === 0) {
    return <PaneMessage icon={<TbCheck size={20} />} title="No bounces" body="Every address you've written to has accepted your mail." />;
  }
  return (
    <PaneMessage
      icon={<TbMailOff size={20} />}
      title={`${report.addresses.length} addresses bounced`}
      body={`Counted from ${report.notices} delivery notices. Pick an address to see how often it was sent to, and why it came back.`}
    />
  );
}

/** The report as a spreadsheet, for taking bounced addresses off campaign lists. */
export function downloadBounceCsv(addresses: BouncedAddress[]) {
  // A leading = + - @ makes a spreadsheet evaluate the cell; quote it as text.
  const cell = (value: string | number) => {
    const text = String(value);
    return `"${(/^[=+\-@]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
  };
  const rows = [
    ["Address", "Type", "Sent", "Bounced", "Delayed", "Last bounce", "Status", "Reason"],
    ...addresses.map((a) => [a.address, bounceKind(a).label, a.sent, a.bounced, a.delayed, a.lastNoticeAt, a.status ?? "", a.reason ?? ""]),
  ];
  const csv = rows.map((row) => row.map(cell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `bounced-addresses-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
