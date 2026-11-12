"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  TbBrandLinkedin,
  TbCircleCheck,
  TbCopy,
  TbExternalLink,
  TbInfoCircle,
  TbLoader2,
  TbMailX,
  TbSearch,
  TbUserPlus,
  TbUserSearch,
  TbMailCheck,
} from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LeadFinderQueue } from "./LeadFinderQueue";

type Confidence = "found" | "pattern" | "guess";

interface Person {
  name: string;
  title: string | null;
  linkedinUrl: string | null;
  email: string | null;
  confidence: Confidence | null;
  alternatives: string[];
  source: string;
  /** Every tool that named this person; two or more means cross-checked. */
  sources?: string[];
}

interface Result {
  company: string;
  domain: string;
  website: string;
  acceptsMail: boolean;
  publishedEmails: string[];
  pattern: string | null;
  people: Person[];
  notes: string[];
}

type VerifyStatus = "verified" | "invalid" | "catchall" | "unknown";
interface VerifyResult {
  email: string;
  status: VerifyStatus;
  detail: string | null;
}

/** What a mailbox check found for one person (their best address, or none). */
const VERIFY: Record<VerifyStatus | "none", { label: string; hint: string; className: string }> = {
  verified: { label: "Verified", hint: "The mail server confirmed this mailbox exists.", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300" },
  catchall: { label: "Accepts any address", hint: "This domain accepts every address, so the mailbox can't be confirmed. Risky.", className: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300" },
  invalid: { label: "Not found", hint: "The mail server says this mailbox doesn't exist.", className: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300" },
  none: { label: "No working email", hint: "None of this person's likely addresses exist.", className: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300" },
  unknown: { label: "Couldn't check", hint: "The mail server didn't give a clear answer.", className: "bg-muted text-muted-foreground" },
};

const CONFIDENCE: Record<Confidence, { label: string; hint: string; className: string }> = {
  found: {
    label: "On their website",
    hint: "This exact address is published on the company's own site.",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  },
  pattern: {
    label: "Company pattern",
    hint: "Built from the address format this company uses. Very likely right, not checked.",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  },
  guess: {
    label: "Guess",
    hint: "The most common format at small companies. Not checked — expect some bounces.",
    className: "bg-muted text-muted-foreground",
  },
};

/**
 * CRM → Lead Finder: company name or website in, the people who run it and
 * their likely work emails out (backend: services/leadFinder.ts). Nothing is
 * saved until "Add to CRM", which goes through the normal lead import
 * (duplicates skipped). Nothing is ever emailed from here.
 */
export function LeadFinder() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [chosenEmail, setChosenEmail] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"search" | "queue">("search");
  // Mailbox checks per person (index), and who is being checked right now.
  const [checks, setChecks] = useState<Record<number, { status: VerifyStatus | "none"; detail: string | null }>>({});
  const [checking, setChecking] = useState<Set<number>>(new Set());

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    // A domain or URL is used as the website; anything else is a company name.
    const isSite = /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(q);
    setSearching(true);
    setError(null);
    setResult(null);
    try {
      const r = await apiFetch<Result>("/leads/finder", { method: "POST", body: JSON.stringify(isSite ? { website: q } : { company: q }) });
      setResult(r);
      // Pre-select everyone whose email is better than a guess.
      setSelected(new Set(r.people.flatMap((p, i) => (p.email && p.confidence !== "guess" ? [i] : []))));
      setChosenEmail({});
      setChecks({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const emailOf = (i: number) => chosenEmail[i] ?? result?.people[i].email ?? null;

  /**
   * Checks the chosen address first, then the others, and keeps the first one
   * whose mailbox exists (nothing is sent). A person with no working address
   * is unticked so they can't be added by mistake.
   */
  const verify = async (i: number) => {
    if (!result) return;
    const p = result.people[i];
    const current = emailOf(i);
    if (!current) return;
    const emails = [current, ...[p.email, ...p.alternatives].filter((e): e is string => Boolean(e) && e !== current)];
    setChecking((s) => new Set(s).add(i));
    try {
      const { best, tried } = await apiFetch<{ best: VerifyResult | null; tried: VerifyResult[] }>("/leads/finder/verify", {
        method: "POST",
        body: JSON.stringify({ emails }),
      });
      if (best) {
        setChosenEmail((c) => ({ ...c, [i]: best.email }));
        setChecks((c) => ({ ...c, [i]: { status: best.status, detail: best.detail } }));
      } else {
        const allInvalid = tried.length > 0 && tried.every((t) => t.status === "invalid");
        setChecks((c) => ({ ...c, [i]: { status: allInvalid ? "none" : "unknown", detail: tried.at(-1)?.detail ?? null } }));
        if (allInvalid) setSelected((s) => { const n = new Set(s); n.delete(i); return n; });
        if (tried.some((t) => /limit/i.test(t.detail ?? ""))) toast.error("Monthly email-check limit reached.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check failed");
    } finally {
      setChecking((s) => { const n = new Set(s); n.delete(i); return n; });
    }
  };

  const verifySelected = async () => {
    // One at a time: the checker allows about one request a second.
    for (const i of [...selected].sort((a, b) => a - b)) {
      if (!checks[i]) await verify(i);
    }
  };

  const addToCrm = async () => {
    if (!result) return;
    const rows = [...selected]
      .map((i) => ({ p: result.people[i], email: emailOf(i) }))
      .filter((r): r is { p: Person; email: string } => Boolean(r.email));
    if (!rows.length) return;
    setSaving(true);
    try {
      const res = await apiFetch<{ imported: number; duplicates: number }>("/leads/import", {
        method: "POST",
        body: JSON.stringify({
          newGroupName: `Lead Finder · ${result.company}`,
          leads: rows.map(({ p, email }) => ({
            name: p.name,
            email,
            company: result.company,
            title: p.title,
            linkedinUrl: p.linkedinUrl,
            website: result.website,
            // A mailbox check wins; otherwise an alternative pick counts as a guess.
            emailStatus: checks[result.people.indexOf(p)]?.status === "verified"
              ? "verified"
              : checks[result.people.indexOf(p)]?.status === "catchall"
                ? "catchall"
                : email === p.email
                  ? p.confidence
                  : "guess",
            source: "Lead Finder",
          })),
        }),
      });
      toast.success(
        `${res.imported} added to CRM${res.duplicates ? ` · ${res.duplicates} already there` : ""} — in the list “Lead Finder · ${result.company}”`
      );
      setSelected(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add to CRM");
    } finally {
      setSaving(false);
    }
  };

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden">
      <main className={cn("flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden glass-panel", isSubNavExpanded ? "lg:rounded-r-xl" : "rounded-xl")}>
        <div className="flex min-h-16 shrink-0 items-center gap-3 border-b border-border/70 px-3 py-2">
          <SubNavToggle />
          <div className="min-w-0 flex-1">
            <h1 className="text-[15px] font-semibold tracking-tight">Lead Finder</h1>
            <p className="truncate text-xs text-muted-foreground">
              {tab === "search"
                ? "Type a company name or website — get the people who run it and their likely emails."
                : "Queue companies; every morning their founders are found, verified and added to the CRM."}
            </p>
          </div>
          <div className="flex shrink-0 rounded-lg border border-border bg-muted/40 p-0.5 text-xs font-medium" role="tablist">
            {(["search", "queue"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn("rounded-md px-3 py-1.5 transition", tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                data-testid={`finder-tab-${t}`}
              >
                {t === "search" ? "Search one" : "Daily queue"}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto flex max-w-5xl flex-col gap-5 p-5 sm:p-7">
            {tab === "queue" ? (
              <LeadFinderQueue />
            ) : (
            <>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void search();
              }}
            >
              <div className="relative flex-1">
                <TbSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Razorpay  or  supabase.com"
                  className="h-11 rounded-xl pl-9 text-sm"
                  data-testid="finder-query"
                  autoFocus
                />
              </div>
              <Button type="submit" className="h-11 rounded-xl px-5" disabled={searching || !query.trim()} data-testid="finder-search">
                {searching ? <TbLoader2 size={16} className="animate-spin" /> : <TbUserSearch size={16} />}
                {searching ? "Searching…" : "Find people"}
              </Button>
            </form>

            {searching && (
              <div className="rounded-2xl border border-border bg-background/60 p-6 text-center text-sm text-muted-foreground">
                Finding the website, reading its pages and searching the web for its leadership — usually 20–40 seconds.
              </div>
            )}
            {error && <div className="rounded-xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300">{error}</div>}

            {!result && !searching && !error && (
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["1. Finds the company", "From its name with a Google search, or straight from the website you give."],
                  ["2. Finds the people", "Founders and leaders named on the site and across the web, with titles and LinkedIn."],
                  ["3. Works out emails", "Uses addresses on their site or their public email format; marks every guess as a guess."],
                ].map(([t, d]) => (
                  <div key={t} className="rounded-2xl border border-border bg-background/60 p-4">
                    <p className="text-sm font-semibold">{t}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d}</p>
                  </div>
                ))}
              </div>
            )}

            {result && (
              <>
                {/* Company */}
                <div className="rounded-2xl border border-border bg-background/70 p-4" data-testid="finder-company">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold">{result.company}</p>
                      <a href={result.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline">
                        {result.domain} <TbExternalLink size={12} />
                      </a>
                    </div>
                    {result.acceptsMail ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                        <TbCircleCheck size={13} /> Domain receives email
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-medium text-red-700 dark:bg-red-400/15 dark:text-red-300">
                        <TbMailX size={13} /> Domain doesn&apos;t receive email
                      </span>
                    )}
                  </div>
                  {result.publishedEmails.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">On their website:</span>
                      {result.publishedEmails.map((e) => (
                        <button key={e} type="button" onClick={() => copy(e)} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] hover:bg-muted/70">
                          {e} <TbCopy size={11} />
                        </button>
                      ))}
                    </div>
                  )}
                  {result.notes.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {result.notes.map((n) => (
                        <li key={n} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <TbInfoCircle size={13} className="mt-px shrink-0" /> {n}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* People */}
                {result.people.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No one to contact here — this domain can&apos;t receive email. Check the website address and search again.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border bg-background/70" data-testid="finder-people">
                    <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-2.5">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          className="size-4 accent-foreground"
                          checked={selected.size === result.people.filter((p) => p.email).length && selected.size > 0}
                          onChange={(e) => setSelected(e.target.checked ? new Set(result.people.flatMap((p, i) => (p.email ? [i] : []))) : new Set())}
                        />
                        {result.people.length} {result.people.length === 1 ? "person" : "people"} · {selected.size} selected
                      </label>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => void verifySelected()} disabled={!selected.size || checking.size > 0} data-testid="finder-verify-all">
                          {checking.size > 0 ? <TbLoader2 size={14} className="animate-spin" /> : <TbMailCheck size={14} />} Verify selected
                        </Button>
                        <Button size="sm" onClick={() => void addToCrm()} disabled={!selected.size || saving} data-testid="finder-add">
                          {saving ? <TbLoader2 size={14} className="animate-spin" /> : <TbUserPlus size={14} />} Add {selected.size || ""} to CRM
                        </Button>
                      </div>
                    </div>
                    <div className="divide-y divide-border/70">
                      {result.people.map((p, i) => {
                        const conf = p.confidence ? CONFIDENCE[p.confidence] : null;
                        const options = p.email ? [p.email, ...p.alternatives] : [];
                        return (
                          <div key={`${p.name}-${i}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
                            <input
                              type="checkbox"
                              className="size-4 accent-foreground"
                              disabled={!p.email}
                              checked={selected.has(i)}
                              onChange={(e) => {
                                const next = new Set(selected);
                                if (e.target.checked) next.add(i);
                                else next.delete(i);
                                setSelected(next);
                              }}
                              aria-label={`Select ${p.name}`}
                            />
                            <div className="min-w-[12rem] flex-1">
                              <p className="flex items-center gap-1.5 text-sm font-medium">
                                {p.name}
                                {p.linkedinUrl && (
                                  <a href={p.linkedinUrl} target="_blank" rel="noreferrer" className="text-[#0a66c2]" aria-label="LinkedIn">
                                    <TbBrandLinkedin size={15} />
                                  </a>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {p.title ?? "Title unknown"} · <span className="opacity-80">{`from ${(p.sources ?? [p.source]).join(" + ")}`}</span>
                              </p>
                            </div>
                            <div className="flex min-w-[16rem] items-center gap-2">
                              {options.length > 1 ? (
                                <select
                                  value={emailOf(i) ?? ""}
                                  onChange={(e) => setChosenEmail({ ...chosenEmail, [i]: e.target.value })}
                                  className="h-8 min-w-0 flex-1 truncate rounded-lg border border-input bg-background px-2 font-mono text-xs"
                                  aria-label={`Email for ${p.name}`}
                                >
                                  {options.map((o, k) => (
                                    <option key={o} value={o}>
                                      {o}
                                      {k > 0 ? " (alternative)" : ""}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="min-w-0 flex-1 truncate font-mono text-xs">{p.email ?? "—"}</span>
                              )}
                              {emailOf(i) && (
                                <button type="button" onClick={() => copy(emailOf(i)!)} className="text-muted-foreground hover:text-foreground" aria-label="Copy email">
                                  <TbCopy size={14} />
                                </button>
                              )}
                            </div>
                            {checks[i] ? (
                              <span
                                title={`${VERIFY[checks[i].status].hint}${checks[i].detail ? ` (${checks[i].detail})` : ""}`}
                                className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", VERIFY[checks[i].status].className)}
                                data-testid={`verify-status-${i}`}
                              >
                                {checks[i].status === "verified" && <TbCircleCheck size={12} />}
                                {VERIFY[checks[i].status].label}
                              </span>
                            ) : (
                              conf && (
                                <span title={conf.hint} className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium", conf.className)}>
                                  {conf.label}
                                </span>
                              )
                            )}
                            {p.email && checks[i]?.status !== "verified" && (
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => void verify(i)} disabled={checking.has(i)} data-testid={`verify-${i}`}>
                                {checking.has(i) ? <TbLoader2 size={13} className="animate-spin" /> : <TbMailCheck size={13} />} Verify
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="px-1 text-xs leading-relaxed text-muted-foreground">
                  “Verify” asks the company&apos;s mail server whether the mailbox exists — nothing is sent. It tries the other likely addresses until one
                  works. Added leads land in the CRM list “Lead Finder · {result.company}”; nothing is emailed from here.
                </p>
              </>
            )}
            </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
