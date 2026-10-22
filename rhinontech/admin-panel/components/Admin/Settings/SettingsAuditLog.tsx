"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { TbChevronDown, TbChevronRight, TbSearch, TbX } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { dateTime, timeAgo } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { LoadingRows, Notice, Pill, SettingsFrame, Spinner, type PillTone } from "@/components/Admin/Settings/parts";

interface Entry {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
}

const PAGE = 50;

/** Events the server names itself, in words a person would use. */
const NAMED: Record<string, { label: string; tone: PillTone }> = {
  "auth.login": { label: "Signed in", tone: "gray" },
  "auth.login_failed": { label: "Failed sign-in attempt", tone: "red" },
  "auth.mfa_failed": { label: "Wrong two-step code", tone: "red" },
  "auth.recovery_code_used": { label: "Signed in with a recovery code", tone: "amber" },
  "auth.password_changed": { label: "Changed their password", tone: "amber" },
  "auth.mfa_enabled": { label: "Turned on two-step verification", tone: "green" },
  "auth.mfa_disabled": { label: "Turned off two-step verification", tone: "amber" },
  "billing.plan_changed": { label: "Plan changed", tone: "blue" },
  "billing.upgrade_requested": { label: "Requested a plan change", tone: "blue" },
  "workspace.export": { label: "Exported the workspace's data", tone: "amber" },
  "workspace.deletion_scheduled": { label: "Scheduled the workspace for deletion", tone: "red" },
  "workspace.deletion_cancelled": { label: "Cancelled the workspace deletion", tone: "green" },
  "workspace.api_key_rotated": { label: "Replaced the API key", tone: "amber" },
  "legal.terms_accepted": { label: "Accepted the terms of service", tone: "gray" },
  "email_domain.requested": { label: "Added an email domain", tone: "blue" },
  "email_domain.removed": { label: "Removed an email domain", tone: "amber" },
};

/** What each module's routes are about, for events recorded as "POST /employees/…". */
const NOUN: Record<string, string> = {
  roles: "a role",
  permissions: "permissions",
  employees: "a person",
  payroll: "payroll",
  people: "a person's record",
  branding: "company branding",
  billing: "billing",
  "letter-templates": "a letter template",
  "mailbox-addresses": "a shared address",
  provisioning: "provisioning",
  "google-calendar": "the calendar connection",
  linkedin: "LinkedIn",
  sites: "a brand",
  documents: "a document",
  leave: "leave",
  performance: "a performance review",
  workspace: "workspace settings",
  "email-domain": "the email domain",
};

export function describeAction(action: string): { label: string; tone: PillTone } {
  const named = NAMED[action];
  if (named) return named;
  const m = action.match(/^(POST|PUT|PATCH|DELETE) \/([^/\s]+)/);
  if (m) {
    const [, method, mount] = m;
    const noun = NOUN[mount] ?? mount.replace(/-/g, " ");
    if (method === "DELETE") return { label: `Deleted ${noun}`, tone: "red" };
    if (method === "POST") return { label: `Created or changed ${noun}`, tone: "blue" };
    return { label: `Updated ${noun}`, tone: "blue" };
  }
  return { label: action, tone: "gray" };
}

const FILTERS: { label: string; query: string }[] = [
  { label: "Everything", query: "" },
  { label: "Sign-ins & security", query: "auth." },
  { label: "People", query: "/employees" },
  { label: "Roles", query: "/roles" },
  { label: "Payroll", query: "/payroll" },
  { label: "Billing", query: "billing." },
  { label: "Data & domains", query: "workspace." },
];

export function SettingsAuditLog() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typed, setTyped] = useState("");
  const [actor, setActor] = useState<{ id: string; name: string } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const seq = useRef(0);

  const fetchPage = useCallback(
    async (before: string | null) => {
      const params = new URLSearchParams({ limit: String(PAGE) });
      if (query) params.set("action", query);
      if (actor) params.set("actorId", actor.id);
      if (before) params.set("before", before);
      return apiFetch<{ entries: Entry[]; nextBefore: string | null }>(`/audit-log?${params}`);
    },
    [query, actor]
  );

  // A new filter starts over. The sequence number drops answers to a filter the
  // user has already moved on from, so a slow reply cannot overwrite a newer one.
  useEffect(() => {
    const mine = ++seq.current;
    setLoading(true);
    setError("");
    fetchPage(null)
      .then((res) => {
        if (mine !== seq.current) return;
        setEntries(res.entries);
        setNext(res.nextBefore);
      })
      .catch((err) => mine === seq.current && setError(err instanceof Error ? err.message : "Could not load the activity log"))
      .finally(() => mine === seq.current && setLoading(false));
  }, [fetchPage]);

  // Typing searches after a short pause rather than on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQuery(typed.trim()), 350);
    return () => clearTimeout(t);
  }, [typed]);

  const loadMore = async () => {
    if (!next) return;
    setMore(true);
    try {
      const res = await fetchPage(next);
      setEntries((prev) => [...prev, ...res.entries]);
      setNext(res.nextBefore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load more");
    } finally {
      setMore(false);
    }
  };

  return (
    <SettingsFrame wide title="Activity log" description="Who did what in this workspace — sign-ins, changes to people and pay, plan and security events">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <TbSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Search activity…"
            className="pl-9"
            data-testid="audit-search"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" data-testid="audit-filters">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => {
                setTyped(f.query);
                setQuery(f.query);
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                query === f.query ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground/80 hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {actor && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
            {`By ${actor.name}`}
            <button type="button" onClick={() => setActor(null)} aria-label="Clear person filter" className="opacity-60 hover:opacity-100"><TbX size={13} /></button>
          </span>
        )}
      </div>

      {error && <Notice tone="danger">{error}</Notice>}
      {loading && <LoadingRows rows={6} />}

      {!loading && !error && entries.length === 0 && (
        <Notice tone="info" testId="audit-empty">Nothing here yet. Sign-ins and changes to your workspace will appear as they happen.</Notice>
      )}

      {!loading && entries.length > 0 && (
        <div className="overflow-x-auto rounded-xl glass-card">
          <table className="w-full min-w-[720px] text-left text-sm" data-testid="audit-table">
            <thead className="glass-thead text-xs text-muted-foreground">
              <tr>
                <th className="w-8 px-3 py-2.5" />
                <th className="px-3 py-2.5 font-medium">When</th>
                <th className="px-3 py-2.5 font-medium">Who</th>
                <th className="px-3 py-2.5 font-medium">What</th>
                <th className="px-3 py-2.5 font-medium">From</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((e) => {
                const d = describeAction(e.action);
                const hasDetail = !!e.metadata && Object.keys(e.metadata).length > 0;
                const expanded = open === e.id;
                return (
                  <Fragment key={e.id}>
                    <tr className="align-top" data-testid="audit-row">
                      <td className="px-3 py-2.5">
                        {hasDetail && (
                          <button type="button" onClick={() => setOpen(expanded ? null : e.id)} aria-label="Show details" className="text-muted-foreground hover:text-foreground">
                            {expanded ? <TbChevronDown size={15} /> : <TbChevronRight size={15} />}
                          </button>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground" title={dateTime(e.createdAt)}>{timeAgo(e.createdAt)}</td>
                      <td className="px-3 py-2.5">
                        {e.actorId && e.actorName ? (
                          <button type="button" className="font-medium underline-offset-2 hover:underline" onClick={() => setActor({ id: e.actorId!, name: e.actorName! })} title="Show only this person's activity">
                            {e.actorName}
                          </button>
                        ) : (
                          <span className="text-muted-foreground">{e.actorName || "—"}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill tone={d.tone}>{d.label}</Pill>
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-muted-foreground/80">{e.action}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted-foreground">{e.ip || "—"}</td>
                    </tr>
                    {expanded && hasDetail && (
                      <tr>
                        <td />
                        <td colSpan={4} className="px-3 pb-3">
                          <pre className="overflow-x-auto rounded-md bg-muted/50 p-2.5 text-xs">{JSON.stringify(e.metadata, null, 2)}</pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {next && !loading && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={more} data-testid="audit-more">
            {more ? <Spinner /> : null} Load older activity
          </Button>
        </div>
      )}
    </SettingsFrame>
  );
}
