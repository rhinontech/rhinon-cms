"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { TbClockHour4, TbFileUpload, TbLoader2, TbPlayerPlay, TbPlus, TbRefresh, TbTrash } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type Status = "queued" | "running" | "done" | "failed";

interface AddedLead {
  name: string;
  title: string | null;
  email: string;
  emailStatus: string;
  sources: string[];
}

interface Target {
  id: string;
  company: string | null;
  website: string | null;
  domain: string | null;
  status: Status;
  peopleFound: number;
  leadsAdded: number;
  result: { added?: AddedLead[]; skipped?: { name: string; reason: string }[] } | null;
  error: string | null;
  processedAt: string | null;
  createdAt: string;
}

interface Item {
  company?: string;
  website?: string;
}

const STATUS: Record<Status, { label: string; className: string }> = {
  queued: { label: "Queued", className: "bg-muted text-muted-foreground" },
  running: { label: "Running", className: "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300" },
  done: { label: "Done", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300" },
};

const looksLikeSite = (s: string) => /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(s.trim());

/** "acme.com", "Acme", or "Acme, acme.com" — one company per line. */
function parseLines(text: string): Item[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.split(/[,\t]/).map((c) => c.trim().replace(/^"|"$/g, "")).filter(Boolean))
    .filter((cells) => cells.length)
    .map((cells) => {
      const website = cells.find(looksLikeSite);
      const company = cells.find((c) => c !== website);
      return { company, website };
    });
}

/** CSV with a header row: picks the website/domain/url and company/name columns. */
function parseCsv(text: string): Item[] {
  const rows = text.split(/\r?\n/).filter((l) => l.trim());
  if (!rows.length) return [];
  const header = rows[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  const siteCol = header.findIndex((h) => /website|domain|url|site/.test(h));
  const nameCol = header.findIndex((h) => /company|organi[sz]ation|name/.test(h));
  if (siteCol < 0 && nameCol < 0) return parseLines(text); // no header: treat as plain lines
  return rows.slice(1).map((row) => {
    const cells = row.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    return { website: siteCol >= 0 ? cells[siteCol] : undefined, company: nameCol >= 0 ? cells[nameCol] : undefined };
  });
}

export function LeadFinderQueue() {
  const [targets, setTargets] = useState<Target[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);
  const [starting, setStarting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const { targets } = await apiFetch<{ targets: Target[] }>("/leads/finder/targets");
      setTargets(targets);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Couldn't load the queue");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // While anything is running, refresh every 10s so results appear as they land.
  const busy = targets?.some((t) => t.status === "running") ?? false;
  useEffect(() => {
    if (!busy && !starting) return;
    const id = setInterval(() => void load(), 10_000);
    return () => clearInterval(id);
  }, [busy, starting, load]);

  const stats = useMemo(() => {
    const t = targets ?? [];
    return {
      queued: t.filter((x) => x.status === "queued").length,
      done: t.filter((x) => x.status === "done").length,
      failed: t.filter((x) => x.status === "failed").length,
      leads: t.reduce((n, x) => n + x.leadsAdded, 0),
    };
  }, [targets]);

  const addItems = async (items: Item[]) => {
    const clean = items.filter((i) => i.company || i.website);
    if (!clean.length) {
      toast.error("Nothing to add — one company or website per line.");
      return;
    }
    setAdding(true);
    try {
      const { added, skipped } = await apiFetch<{ added: number; skipped: number }>("/leads/finder/targets", {
        method: "POST",
        body: JSON.stringify({ items: clean.slice(0, 500) }),
      });
      toast.success(`${added} added to the queue${skipped ? ` · ${skipped} already queued` : ""}`);
      setText("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add");
    } finally {
      setAdding(false);
    }
  };

  const onFile = async (file: File) => {
    await addItems(parseCsv(await file.text()));
    if (fileRef.current) fileRef.current.value = "";
  };

  const runNow = async () => {
    setStarting(true);
    try {
      await apiFetch("/leads/finder/run", { method: "POST" });
      toast.success("Started — results appear here as each company finishes.");
      setTimeout(() => void load(), 3000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start");
    } finally {
      // Keep polling a few minutes after a manual start.
      setTimeout(() => setStarting(false), 5 * 60_000);
    }
  };

  const retry = async (id: string) => {
    await apiFetch(`/leads/finder/targets/${id}/retry`, { method: "POST" }).catch(() => toast.error("Couldn't retry"));
    await load();
  };

  const remove = async (id: string) => {
    await apiFetch(`/leads/finder/targets/${id}`, { method: "DELETE" }).catch(() => toast.error("Couldn't remove"));
    setTargets((t) => t?.filter((x) => x.id !== id) ?? null);
  };

  return (
    <div className="flex flex-col gap-5" data-testid="finder-queue">
      <div className="rounded-2xl border border-border bg-background/70 p-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"One company per line — a website, a name, or both:\nslickblinds.com\nRazorpay\nSupabase, supabase.com"}
          className="min-h-[120px] rounded-xl font-mono text-[13px]"
          data-testid="queue-input"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => void addItems(parseLines(text))} disabled={adding || !text.trim()} data-testid="queue-add">
            {adding ? <TbLoader2 size={14} className="animate-spin" /> : <TbPlus size={14} />} Add to queue
          </Button>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && void onFile(e.target.files[0])} />
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={adding}>
            <TbFileUpload size={14} /> Upload CSV
          </Button>
          <span className="text-xs text-muted-foreground">CSV needs a “website” or “company” column. Up to 500 at a time.</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Stat label="Queued" value={stats.queued} />
        <Stat label="Done" value={stats.done} />
        <Stat label="Failed" value={stats.failed} />
        <Stat label="Leads added" value={stats.leads} highlight />
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
            <TbClockHour4 size={13} /> Runs daily at 7:00 AM
          </span>
          <Button size="sm" variant="outline" onClick={() => void runNow()} disabled={!stats.queued || busy} data-testid="queue-run">
            {busy ? <TbLoader2 size={14} className="animate-spin" /> : <TbPlayerPlay size={14} />} Run now
          </Button>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300">
          {loadError}{" "}
          <button className="underline" onClick={() => void load()}>
            Try again
          </button>
        </div>
      ) : targets === null ? (
        <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
          <TbLoader2 size={16} className="animate-spin" /> Loading the queue…
        </div>
      ) : targets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          The queue is empty. Paste some websites above — each morning their founders are found, their emails checked, and the ones that work
          land in the CRM list “Lead Finder”.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-background/70 divide-y divide-border/70" data-testid="queue-list">
          {targets.map((t) => {
            const added = t.result?.added ?? [];
            const skipped = t.result?.skipped ?? [];
            return (
              <div key={t.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium">{t.company || t.domain}</span>
                    {t.company && t.domain && <span className="truncate text-xs text-muted-foreground">{t.domain}</span>}
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS[t.status].className)}>
                      {t.status === "running" && <TbLoader2 size={11} className="mr-1 animate-spin" />}
                      {STATUS[t.status].label}
                    </span>
                  </div>
                  {t.status === "done" && (
                    <div className="mt-1.5 flex flex-col gap-1 text-xs">
                      {added.length ? (
                        added.map((a) => (
                          <span key={a.email} className="text-foreground/90">
                            {`${a.name}${a.title ? ` · ${a.title}` : ""} — `}
                            <span className="font-mono">{a.email}</span>
                            <span className="text-muted-foreground">{` (${a.emailStatus === "verified" ? "verified" : a.emailStatus === "catchall" ? "accepts any address" : "listed, not checked"})`}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground">{`${t.peopleFound} people found, none with a working email.`}</span>
                      )}
                      {skipped.length > 0 && (
                        <span className="text-muted-foreground">{`Skipped: ${skipped.map((s) => `${s.name} (${s.reason})`).join(", ")}`}</span>
                      )}
                    </div>
                  )}
                  {t.status === "failed" && t.error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{t.error}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {t.status === "done" && <span className="mr-2 text-xs font-medium tabular-nums">{`${t.leadsAdded} added`}</span>}
                  {(t.status === "failed" || t.status === "done") && (
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => void retry(t.id)} title="Run this company again">
                      <TbRefresh size={13} /> Retry
                    </Button>
                  )}
                  {t.status !== "running" && (
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => void remove(t.id)} title="Remove from the queue">
                      <TbTrash size={13} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={cn("rounded-xl border border-border px-3 py-1.5", highlight ? "bg-emerald-50 dark:bg-emerald-400/10" : "bg-background/70")}>
      <span className="text-[11px] text-muted-foreground">{label}</span>{" "}
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}
