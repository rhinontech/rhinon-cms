"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Circle, Loader2, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { ManageContext } from "../EventManage";
import { eventsApi, type EnrollmentTemplate, type Guest, type ReminderTemplate } from "../api";
import { GuestStatusBadge, formatDateTime } from "../ui";

/** One labelled row with a single-hue magnitude bar; the label carries identity. */
function BreakdownRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">{value}</span> · {pct}%
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * Registrations per day over the last 21 days. One series, so one hue and no
 * legend; each column shows its day and count on hover, with the hit target
 * the full column height rather than the bar alone.
 */
function RegistrationTrend({ guests }: { guests: Guest[] }) {
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 21 }, (_, i) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (20 - i));
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      const count = guests.filter((g) => {
        const t = new Date(g.createdAt).getTime();
        return t >= day.getTime() && t < next.getTime();
      }).length;
      return { day, count };
    });
  }, [guests]);
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((s, d) => s + d.count, 0);

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[14px] font-semibold">Registrations, last 21 days</h3>
        <span className="text-[13px] text-muted-foreground"><span className="font-semibold text-foreground">{total}</span> in this period</span>
      </div>
      <div className="mt-6 flex h-36 items-end gap-[2px] border-b border-border" role="img" aria-label={`Registrations per day; ${total} in the last 21 days`}>
        {days.map(({ day, count }) => (
          <div key={day.toISOString()} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-[4px] bg-primary/80 group-hover:bg-primary transition-colors"
              style={{ height: count ? `${Math.max(4, (count / max) * 100)}%` : "0%" }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-[12px] text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
              {day.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · <span className="font-semibold">{count}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11.5px] text-muted-foreground">
        <span>{days[0].day.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

export default function OverviewTab({ event, guests, reloadEvent, goTo }: ManageContext) {
  const [accepting, setAccepting] = useState(Boolean(event.canAcceptResponse));
  const [toggling, setToggling] = useState(false);
  const [enrollment, setEnrollment] = useState<EnrollmentTemplate[] | null>(null);
  const [reminders, setReminders] = useState<ReminderTemplate[] | null>(null);
  const [hasCertificate, setHasCertificate] = useState<boolean | null>(null);

  useEffect(() => setAccepting(Boolean(event.canAcceptResponse)), [event.canAcceptResponse]);
  useEffect(() => {
    const id = String(event.id);
    eventsApi.enrollment(id).then(setEnrollment).catch(() => setEnrollment([]));
    eventsApi.reminders(id).then(setReminders).catch(() => setReminders([]));
    eventsApi.certificate(id).then((c) => setHasCertificate(Boolean(c))).catch(() => setHasCertificate(false));
  }, [event.id]);

  const team = ["Hackathon", "Teardown"].includes(event.eventType);
  const count = (fn: (g: Guest) => boolean) => guests.filter(fn).length;
  const roles = {
    Professional: count((g) => g.userType === "Professional"),
    Student: count((g) => g.userType === "Student"),
  };
  const other = guests.length - roles.Professional - roles.Student;
  const configured = new Set((enrollment ?? []).map((t) => t.type));
  const neededEnrollment = team ? ["Registered"] : ["Pending", "Approved", "Declined"];

  const steps = [
    { done: Boolean(event.isPublished), label: "Publish the event page", tab: null },
    { done: neededEnrollment.every((t) => configured.has(t as EnrollmentTemplate["type"])), label: `Write the ${neededEnrollment.join(" / ")} enrollment email${neededEnrollment.length > 1 ? "s" : ""}`, tab: "emails" as const },
    { done: !count((g) => g.guestType === "Waitlist"), label: `Decide on the waitlist (${count((g) => g.guestType === "Waitlist")} waiting)`, tab: "guests" as const },
    { done: (reminders ?? []).some((r) => ["scheduled", "sent"].includes(r.status)), label: "Schedule a reminder before the event", tab: "emails" as const },
    { done: Boolean(hasCertificate), label: "Design the certificate", tab: "certificates" as const },
  ];

  const recent = [...guests].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6);

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
      <div className="space-y-6 min-w-0">
        <RegistrationTrend guests={guests} />

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-[14px] font-semibold">By status</h3>
            <BreakdownRow label="Approved" value={count((g) => g.guestType === "Approved")} total={guests.length} />
            <BreakdownRow label="Waitlist" value={count((g) => g.guestType === "Waitlist")} total={guests.length} />
            <BreakdownRow label="Declined" value={count((g) => g.guestType === "Declined")} total={guests.length} />
          </div>
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-[14px] font-semibold">By role</h3>
            <BreakdownRow label="Professionals" value={roles.Professional} total={guests.length} />
            <BreakdownRow label="Students" value={roles.Student} total={guests.length} />
            <BreakdownRow label="Not specified" value={other} total={guests.length} />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold">Latest registrations</h3>
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => goTo("guests")}>
              All guests <ArrowRight className="size-3.5" />
            </Button>
          </div>
          {recent.length ? (
            <ul className="mt-3 divide-y divide-border">
              {recent.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium">{g.name}</p>
                    <p className="truncate text-[12.5px] text-muted-foreground">{g.email} · {formatDateTime(g.createdAt)}</p>
                  </div>
                  <GuestStatusBadge status={g.guestType} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[13px] text-muted-foreground">No registrations yet.</p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-[14px] font-semibold">
                <MessageSquareText className="size-4" /> {team ? "Accept submissions" : "Accept feedback"}
              </h3>
              <p className="mt-1 text-[12.5px] text-muted-foreground leading-relaxed">
                Approved guests can submit {team ? "their team's work" : "feedback"} from their personal link while this is on.
                {!team ? " Workshop certificates are approved from feedback." : ""}
              </p>
            </div>
            {toggling ? (
              <Loader2 className="size-4 animate-spin mt-1" />
            ) : (
              <Switch
                checked={accepting}
                aria-label="Accept responses"
                onCheckedChange={async (value) => {
                  setToggling(true);
                  setAccepting(value);
                  try {
                    await eventsApi.toggleResponses(String(event.id), value);
                    toast.success(value ? "Now accepting responses" : "Responses closed");
                    await reloadEvent();
                  } catch (err) {
                    setAccepting(!value);
                    toast.error(err instanceof Error ? err.message : "Could not change this");
                  } finally {
                    setToggling(false);
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-[14px] font-semibold">Setup checklist</h3>
          <ul className="mt-4 space-y-3">
            {steps.map((step) => (
              <li key={step.label} className="flex items-start gap-2.5 text-[13px]">
                {step.done ? (
                  <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label="Done" />
                ) : (
                  <Circle className="size-4 mt-0.5 shrink-0 text-muted-foreground" aria-label="To do" />
                )}
                <span className={step.done ? "text-muted-foreground line-through decoration-muted-foreground/40" : ""}>
                  {step.tab && !step.done ? (
                    <button type="button" className="text-left hover:text-primary hover:underline underline-offset-2" onClick={() => goTo(step.tab!)}>
                      {step.label}
                    </button>
                  ) : (
                    step.label
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold">Enrollment emails</h3>
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => goTo("emails")}>
              Edit <ArrowRight className="size-3.5" />
            </Button>
          </div>
          <ul className="mt-3 space-y-2 text-[13px]">
            {(team ? ["Registered", "Registered_Student", "Registered_Professional"] : ["Pending", "Approved", "Declined"]).map((type) => (
              <li key={type} className="flex items-center justify-between">
                <span>{type.replace("_", " · ")}</span>
                <span className={configured.has(type as EnrollmentTemplate["type"]) ? "text-emerald-700 dark:text-emerald-400 font-medium" : "text-muted-foreground"}>
                  {enrollment === null ? "…" : configured.has(type as EnrollmentTemplate["type"]) ? "Set up" : "Not sent"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
