"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { TbAlertTriangle, TbCheck, TbTrash } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { apiFetch } from "@/lib/api";
import { dateTime, daysUntil, plural, shortDate, timeAgo } from "@/lib/dates";
import { describeAction } from "@/components/Admin/Settings/SettingsAuditLog";
import { LoadingRows, Meter, Notice, Pill, Spinner } from "@/components/Admin/Settings/parts";
import type { OrgDetail, OrgStatus, PlanId } from "./types";

const PLAN_LABEL: Record<PlanId, string> = { free: "Free trial", starter: "Starter", enterprise: "Enterprise" };

function Section({ title, children, testId }: { title: string; children: React.ReactNode; testId?: string }) {
  return (
    <section data-testid={testId} className="grid gap-3 rounded-xl border border-border bg-card/50 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 break-words text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

/**
 * Everything the platform team needs to look after one customer workspace: what
 * they are on, what they use, who owns it, what they asked for — and the levers to
 * change their plan, extend a trial, suspend, or remove them. Deliberately shows
 * state ABOUT the workspace and never its content: no leads, messages or payroll,
 * and no way to act as one of its users.
 */
export function WorkspaceDetail({
  orgId,
  onClose,
  onChanged,
}: {
  orgId: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<OrgDetail | null>(null);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<PlanId>("free");
  const [status, setStatus] = useState<OrgStatus>("trial");
  const [busy, setBusy] = useState<string | null>(null);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeSlug, setPurgeSlug] = useState("");

  const load = useCallback(async () => {
    if (!orgId) return;
    try {
      const d = await apiFetch<OrgDetail>(`/platform/organizations/${orgId}`);
      setDetail(d);
      setPlan(d.plan);
      setStatus(d.status);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this workspace");
    }
  }, [orgId]);

  useEffect(() => {
    setDetail(null);
    setError("");
    if (orgId) void load();
  }, [orgId, load]);

  const patch = async (key: string, body: Record<string, unknown>, done: string) => {
    if (!orgId) return;
    setBusy(key);
    try {
      await apiFetch(`/platform/organizations/${orgId}`, { method: "PATCH", body: JSON.stringify(body) });
      toast.success(done);
      await load();
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not make that change");
    } finally {
      setBusy(null);
    }
  };

  const purge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    setBusy("purge");
    try {
      const res = await apiFetch<{ rowsDeleted: number }>(`/platform/organizations/${detail.id}/purge`, {
        method: "POST",
        body: JSON.stringify({ confirmSlug: purgeSlug }),
      });
      toast.success(`${detail.name} purged — ${res.rowsDeleted.toLocaleString()} records removed.`);
      setPurgeOpen(false);
      onChanged();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Purge failed");
    } finally {
      setBusy(null);
    }
  };

  const d = detail;
  const left = daysUntil(d?.trialEndsAt);
  const planChanged = !!d && (plan !== d.plan || status !== d.status);

  return (
    <Sheet open={!!orgId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl" data-testid="workspace-detail">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex flex-wrap items-center gap-2 pr-8">
            {d?.name ?? "Workspace"}
            {d?.isPlatform && <Pill tone="blue">Platform</Pill>}
            {d && !d.isPlatform && d.status === "active" && <Pill tone="green">Active</Pill>}
            {d && !d.isPlatform && d.status === "trial" && <Pill tone={d.trialExpired ? "red" : "blue"}>{d.trialExpired ? "Trial ended" : "Trial"}</Pill>}
            {d && d.status === "suspended" && <Pill tone="red">Suspended</Pill>}
          </SheetTitle>
          <SheetDescription>{d ? `${d.slug} · ${d.emailDomain} · joined ${shortDate(d.createdAt)}` : "Loading…"}</SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 px-4 pb-6">
          {error && <Notice tone="danger">{error}</Notice>}
          {!d && !error && <LoadingRows rows={5} />}

          {d && (
            <>
              {d.upgradeRequest && (
                <Notice tone="info" testId="detail-upgrade-request">
                  <p className="font-medium">{`Asked for the ${PLAN_LABEL[d.upgradeRequest.plan as PlanId] ?? d.upgradeRequest.plan} plan ${timeAgo(d.upgradeRequest.at)}.`}</p>
                  {d.upgradeRequest.note && <p className="mt-1 whitespace-pre-wrap opacity-90">{`“${d.upgradeRequest.note}”`}</p>}
                  <Button
                    size="sm"
                    className="mt-2"
                    disabled={!!busy}
                    data-testid="approve-request"
                    onClick={() => patch("approve", { plan: d.upgradeRequest!.plan, status: "active" }, `${d.name} moved to ${PLAN_LABEL[d.upgradeRequest!.plan as PlanId] ?? d.upgradeRequest!.plan}`)}
                  >
                    {busy === "approve" ? <Spinner /> : <TbCheck />} Approve and activate
                  </Button>
                </Notice>
              )}

              {d.deletion.scheduled && (
                <Notice tone="danger" testId="detail-deletion">
                  {`The owner scheduled this workspace for deletion on ${dateTime(d.deletion.scheduledFor)}.`}
                </Notice>
              )}

              <Section title="Owner">
                {d.owner ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Fact label="Name">{d.owner.name}</Fact>
                    <Fact label="Sign-up email"><a className="underline underline-offset-2" href={`mailto:${d.owner.email}`}>{d.owner.email}</a></Fact>
                    <Fact label="Company address">{d.owner.companyEmail}</Fact>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No owner found.</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {d.emailVerificationPending ? <Pill tone="amber">Email not confirmed — sending is paused</Pill> : <Pill tone="green">Email confirmed</Pill>}
                  {!d.isPlatform && (d.terms.accepted ? <Pill tone="green">{`Terms ${d.terms.accepted} accepted`}</Pill> : <Pill tone="amber">Terms not accepted</Pill>)}
                </div>
              </Section>

              {!d.isPlatform && (
                <Section title="Plan & status" testId="detail-plan">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label>Plan</Label>
                      <Select value={plan} onValueChange={(v) => setPlan(v as PlanId)}>
                        <SelectTrigger className="w-full" data-testid="plan-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(PLAN_LABEL) as PlanId[]).map((p) => <SelectItem key={p} value={p}>{PLAN_LABEL[p]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Status</Label>
                      <Select value={status} onValueChange={(v) => setStatus(v as OrgStatus)}>
                        <SelectTrigger className="w-full" data-testid="status-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="active">Active (paid)</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {status === "suspended" && status !== d.status && (
                    <Notice tone="warning">Suspending signs everyone in this workspace out and blocks new sign-ins until you reinstate it.</Notice>
                  )}
                  <div>
                    <Button
                      size="sm"
                      disabled={!planChanged || !!busy}
                      data-testid="apply-plan"
                      onClick={() => patch("plan", { plan, status }, `${d.name} updated`)}
                    >
                      {busy === "plan" ? <Spinner /> : null} Apply changes
                    </Button>
                  </div>

                  {d.status === "trial" && (
                    <div className="grid gap-2 border-t border-border pt-3">
                      <p className="text-sm">
                        {d.trialEndsAt
                          ? d.trialExpired
                            ? `Trial ended ${shortDate(d.trialEndsAt)}.`
                            : `Trial ends ${shortDate(d.trialEndsAt)} — ${plural(left ?? 0, "day")} left.`
                          : "No trial deadline set."}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">Extend by</span>
                        {[7, 14, 30].map((days) => (
                          <Button
                            key={days}
                            size="sm"
                            variant="outline"
                            disabled={!!busy}
                            data-testid={`extend-${days}`}
                            onClick={() => patch(`extend-${days}`, { extendTrialDays: days }, `Trial extended by ${days} days`)}
                          >
                            {busy === `extend-${days}` ? <Spinner /> : null} {`${days} days`}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </Section>
              )}

              {d.usage && (
                <Section title="Usage today">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Meter label="People" used={d.usage.seats.used} limit={d.usage.seats.limit} />
                    <Meter label="Emails" used={d.usage.emailsToday.used} limit={d.usage.emailsToday.limit} />
                    <Meter label="AI drafts" used={d.usage.aiToday.used} limit={d.usage.aiToday.limit} />
                  </div>
                </Section>
              )}

              <Section title="Sending domains">
                {d.customDomain.domains.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{`Sends from ${d.emailDomain}.`}</p>
                ) : (
                  <ul className="grid gap-2">
                    {d.customDomain.domains.map((dom) => (
                      <li key={dom.domain} className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-mono">{dom.domain}</span>
                        <Pill tone={dom.status === "verified" ? "green" : dom.status === "failed" ? "red" : "amber"}>{dom.status}</Pill>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Recent activity" testId="detail-audit">
                {d.recentAudit.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {d.recentAudit.slice(0, 15).map((a) => (
                      <li key={a.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                        <span className="min-w-0">
                          <span className="font-medium">{a.actorName || "—"}</span>{" "}
                          <span className="text-muted-foreground">{describeAction(a.action).label.toLowerCase()}</span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground" title={dateTime(a.createdAt)}>{timeAgo(a.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {!d.isPlatform && (
                <section className="grid gap-2 rounded-xl border border-red-300/60 p-4 dark:border-red-400/30" data-testid="detail-danger">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                    <TbAlertTriangle size={14} /> Danger zone
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently erases this workspace and everything in it, immediately. Customers delete their own workspace from their settings with a grace period — use this for spam and abuse.
                  </p>
                  <div>
                    <Button size="sm" variant="destructive" onClick={() => { setPurgeSlug(""); setPurgeOpen(true); }} data-testid="purge-open">
                      <TbTrash /> Purge workspace…
                    </Button>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <Dialog open={purgeOpen} onOpenChange={setPurgeOpen}>
          <DialogContent>
            <form onSubmit={purge} className="grid gap-4">
              <DialogHeader>
                <DialogTitle>{`Purge ${d?.name}?`}</DialogTitle>
                <DialogDescription>
                  Every person, lead, campaign, document and file is erased now. There is no undo and no grace period.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-1.5">
                <Label htmlFor="purge-slug">
                  Type <span className="font-mono font-semibold">{d?.slug}</span> to confirm
                </Label>
                <Input id="purge-slug" value={purgeSlug} onChange={(e) => setPurgeSlug(e.target.value)} autoComplete="off" spellCheck={false} data-testid="purge-slug" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPurgeOpen(false)} disabled={busy === "purge"}>Cancel</Button>
                <Button type="submit" variant="destructive" disabled={purgeSlug.trim().toLowerCase() !== d?.slug || busy === "purge"} data-testid="purge-confirm">
                  {busy === "purge" ? <Spinner /> : null} Purge now
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
