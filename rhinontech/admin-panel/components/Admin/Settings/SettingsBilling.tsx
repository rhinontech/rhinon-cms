"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { TbCheck, TbMinus, TbSend } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch } from "@/lib/api";
import { daysUntil, plural, shortDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { LoadingRows, Meter, Notice, Pill, SettingsCard, SettingsFrame } from "@/components/Admin/Settings/parts";

type PlanId = "free" | "starter" | "enterprise";

interface Usage {
  plan: PlanId;
  planLabel: string;
  status: "active" | "trial" | "suspended";
  trialEndsAt: string | null;
  trialExpired: boolean;
  isPlatform: boolean;
  seats: { used: number; limit: number | null };
  emailsToday: { used: number; limit: number | null };
  aiToday: { used: number; limit: number | null };
  upgradeRequest: { plan: string; note: string | null; at: string } | null;
}

interface PlanRow {
  id: PlanId;
  label: string;
  seats: number | null;
  emailsPerDay: number | null;
  aiPerDay: number | null;
  customDomains: number | null;
}

const num = (n: number | null, unit: string) => (n === null ? `Unlimited ${unit}` : `${n.toLocaleString()} ${unit}`);

function Feature({ on = true, children }: { on?: boolean; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-start gap-2 text-sm", on ? "text-foreground/90" : "text-muted-foreground/70")}>
      {on ? <TbCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" /> : <TbMinus size={16} className="mt-0.5 shrink-0" />}
      <span>{children}</span>
    </li>
  );
}

export function SettingsBilling() {
  const { isOwner, refresh } = usePermissions();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [error, setError] = useState("");
  const [requesting, setRequesting] = useState<PlanRow | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const [u, p] = await Promise.all([apiFetch<Usage>("/billing/usage"), apiFetch<PlanRow[]>("/billing/plans")]);
      setUsage(u);
      setPlans(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your plan");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const send = async () => {
    if (!requesting) return;
    setSending(true);
    try {
      await apiFetch("/billing/upgrade-request", { method: "POST", body: JSON.stringify({ plan: requesting.id, note }) });
      toast.success("Request sent. The Rhinon team will be in touch.");
      setRequesting(null);
      setNote("");
      await load();
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the request");
    } finally {
      setSending(false);
    }
  };

  const left = daysUntil(usage?.trialEndsAt);

  return (
    <SettingsFrame title="Plan & usage" description="What your workspace includes and how much of it you are using">
      {error && <Notice tone="danger">{error}</Notice>}
      {!usage && !error && <LoadingRows rows={4} />}

      {usage && usage.isPlatform && (
        <Notice tone="info" testId="platform-plan-note">
          This is the platform workspace. It has no plan limits — seats, email volume and AI use are unmetered.
        </Notice>
      )}

      {usage && (
        <>
          <SettingsCard testId="current-plan">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current plan</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight" data-testid="plan-label">{usage.planLabel}</h2>
                  {usage.status === "trial" && !usage.isPlatform && <Pill tone={usage.trialExpired ? "red" : "blue"}>{usage.trialExpired ? "Trial ended" : "Trial"}</Pill>}
                  {usage.status === "active" && <Pill tone="green">Active</Pill>}
                  {usage.status === "suspended" && <Pill tone="red">Suspended</Pill>}
                </div>
                {usage.status === "trial" && !usage.isPlatform && usage.trialEndsAt && (
                  <p className="mt-1.5 text-sm text-muted-foreground" data-testid="trial-line">
                    {usage.trialExpired
                      ? `Your trial ended on ${shortDate(usage.trialEndsAt)}. The workspace is read-only until you upgrade.`
                      : `Your trial ends on ${shortDate(usage.trialEndsAt)} — ${plural(left ?? 0, "day")} left.`}
                  </p>
                )}
              </div>
              {usage.upgradeRequest && (
                <Notice tone="success" testId="upgrade-pending">
                  {`You asked for the ${usage.upgradeRequest.plan} plan on ${shortDate(usage.upgradeRequest.at)}. We will be in touch.`}
                </Notice>
              )}
            </div>
          </SettingsCard>

          <SettingsCard title="Usage" description="Email and AI limits reset every day at midnight IST.">
            <div className="grid gap-6 sm:grid-cols-3">
              <Meter testId="meter-seats" label="People" used={usage.seats.used} limit={usage.seats.limit} hint="Active employees. Client collaborators are free." />
              <Meter testId="meter-emails" label="Emails sent today" used={usage.emailsToday.used} limit={usage.emailsToday.limit} hint="Outreach, automations and new messages." />
              <Meter testId="meter-ai" label="AI drafts today" used={usage.aiToday.used} limit={usage.aiToday.limit} hint="Email drafts, templates, posts and enrichment." />
            </div>
          </SettingsCard>

          {!usage.isPlatform && (
            <SettingsCard title="Plans" description={isOwner ? "Ask for a different plan and we will set it up for you." : "Only the workspace owner can request a plan change."}>
              <div className="grid gap-4 md:grid-cols-3" data-testid="plan-grid">
                {plans.map((plan) => {
                  const current = plan.id === usage.plan;
                  const asked = usage.upgradeRequest?.plan === plan.id;
                  return (
                    <div
                      key={plan.id}
                      data-testid={`plan-${plan.id}`}
                      className={cn("flex flex-col rounded-xl border p-4", current ? "border-primary/60 bg-primary/5" : "border-border bg-card/50")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-base font-semibold">{plan.label}</h4>
                        {current && <Pill tone="blue">Current</Pill>}
                      </div>
                      <ul className="mt-3 flex flex-1 flex-col gap-2">
                        <Feature>{num(plan.seats, "people")}</Feature>
                        <Feature>{num(plan.emailsPerDay, "emails a day")}</Feature>
                        <Feature>{num(plan.aiPerDay, "AI drafts a day")}</Feature>
                        <Feature on={(plan.customDomains ?? 1) > 0}>
                          {plan.customDomains === 0 ? "Sending from your own domain" : "Send from your own domain"}
                        </Feature>
                      </ul>
                      {plan.id !== "free" && !current && (
                        <Button
                          className="mt-4 w-full"
                          variant={asked ? "outline" : "default"}
                          size="sm"
                          disabled={!isOwner || asked}
                          onClick={() => setRequesting(plan)}
                        >
                          <TbSend /> {asked ? "Requested" : `Request ${plan.label}`}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </SettingsCard>
          )}
        </>
      )}

      <Dialog open={!!requesting} onOpenChange={(open) => !open && setRequesting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{`Request the ${requesting?.label} plan`}</DialogTitle>
            <DialogDescription>
              We will email you to confirm pricing and switch your workspace over. Nothing changes until we do.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="upgrade-note">Anything we should know? (optional)</Label>
            <Textarea
              id="upgrade-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Team size, what you want to do, when you need it by…"
              maxLength={1000}
              className="min-h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequesting(null)} disabled={sending}>Cancel</Button>
            <Button onClick={send} disabled={sending} data-testid="send-upgrade-request">{sending ? "Sending…" : "Send request"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsFrame>
  );
}
