"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { TbArrowRight, TbBriefcase, TbCheck, TbTargetArrow, TbUsers, TbX } from "react-icons/tb";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Goal, SetupState, SetupStep } from "./types";

const STEP_COPY: Record<SetupStep, { title: string; body: string }> = {
  verifyEmail: { title: "Confirm your email", body: "Sending switches on once you click the link we emailed you. You can resend it from the banner at the top." },
  inviteTeam: { title: "Invite your team", body: "Add the people you work with and choose what each of them can see." },
  importContacts: { title: "Add your contacts", body: "Import a CSV of leads, or add your first one by hand." },
  firstCampaign: { title: "Send your first campaign", body: "AI drafts each email from your leads. Nothing goes out until you approve it." },
  firstProject: { title: "Create your first project", body: "Plan the work in tasks, then share a portal with your client." },
  installChatbot: { title: "Put the AI chatbot on your website", body: "Train it on your site and paste one line of code." },
  leaveTypes: { title: "Set up leave types", body: "Casual, sick, earned: how many days of each, so your team can request time off." },
};

/** The checklist follows what the owner said they want to do first. */
const ORDER: Record<Goal | "none", SetupStep[]> = {
  sell: ["verifyEmail", "inviteTeam", "importContacts", "firstCampaign", "installChatbot"],
  deliver: ["verifyEmail", "inviteTeam", "firstProject", "importContacts", "installChatbot"],
  team: ["verifyEmail", "inviteTeam", "leaveTypes", "firstProject"],
  none: ["verifyEmail", "inviteTeam", "importContacts", "firstProject", "installChatbot"],
};

export function stepsFor(setup: SetupState): SetupStep[] {
  // The chatbot is a paid add-on: no step for something the plan can't do.
  return ORDER[setup.goal ?? "none"].filter((step) => step !== "installChatbot" || setup.chatbotAllowed);
}

export function setupComplete(setup: SetupState): boolean {
  return stepsFor(setup).every((step) => setup.steps[step]);
}

const GOALS: Array<{ goal: Goal; title: string; body: string; icon: React.ReactNode }> = [
  { goal: "sell", title: "Win clients", body: "CRM, AI outreach and the website chatbot", icon: <TbTargetArrow size={20} /> },
  { goal: "deliver", title: "Deliver projects", body: "Projects, tasks and a portal for clients", icon: <TbBriefcase size={20} /> },
  { goal: "team", title: "Run my team", body: "People, attendance, leave and payroll", icon: <TbUsers size={20} /> },
];

/** "What do you want to do first?" — asked once, on the owner's first visit. */
export function GoalQuestion({ onAnswer, onSkip }: { onAnswer: (goal: Goal) => void; onSkip: () => void }) {
  const [saving, setSaving] = useState<Goal | null>(null);

  const choose = async (goal: Goal) => {
    setSaving(goal);
    try {
      await apiFetch("/home/onboarding", { method: "PUT", body: JSON.stringify({ goal }) });
      onAnswer(goal);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save that. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="rounded-xl glass-card p-5" data-testid="goal-question">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">What do you want to do first?</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">We will put the right next steps on this screen. Everything else stays one click away.</p>
        </div>
        <button onClick={onSkip} className="shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">Not now</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {GOALS.map((g) => (
          <button
            key={g.goal}
            onClick={() => choose(g.goal)}
            disabled={saving !== null}
            className="group flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{g.icon}</span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">{saving === g.goal ? "Saving…" : g.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{g.body}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** The first-run checklist: done steps ticked, the next one opened up with a way to do it. */
export function SetupChecklist({ setup, hrefFor, onDismiss }: { setup: SetupState; hrefFor: (step: SetupStep) => string | null; onDismiss: () => void }) {
  const steps = stepsFor(setup);
  const doneCount = steps.filter((step) => setup.steps[step]).length;
  const next = steps.find((step) => !setup.steps[step]);
  const [hiding, setHiding] = useState(false);

  const dismiss = async () => {
    setHiding(true);
    try {
      await apiFetch("/home/onboarding", { method: "PUT", body: JSON.stringify({ dismissed: true }) });
      onDismiss();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not hide the checklist");
      setHiding(false);
    }
  };

  return (
    <section id="setup" className="scroll-mt-4 overflow-hidden rounded-xl glass-card" data-testid="setup-checklist">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Get set up</h2>
          <p className="text-xs text-muted-foreground">{`${doneCount} of ${steps.length} done`}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-muted sm:block" aria-hidden>
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
          </div>
          <button onClick={dismiss} disabled={hiding} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Hide the checklist" title="Hide the checklist">
            <TbX size={16} />
          </button>
        </div>
      </div>
      <ol className="divide-y divide-border">
        {steps.map((step) => {
          const done = setup.steps[step];
          const isNext = step === next;
          const href = hrefFor(step);
          return (
            <li key={step} className={cn("flex items-start gap-3 px-5 py-3", isNext && "bg-primary/[0.04]")}>
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  done ? "border-emerald-500 bg-emerald-500 text-white" : isNext ? "border-primary" : "border-border"
                )}
              >
                {done && <TbCheck size={12} strokeWidth={3} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", done ? "text-muted-foreground line-through" : "text-foreground")}>{STEP_COPY[step].title}</p>
                {isNext && <p className="mt-0.5 text-xs text-muted-foreground">{STEP_COPY[step].body}</p>}
              </div>
              {!done && href && (
                <Link
                  href={href}
                  prefetch={false}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold",
                    isNext ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-foreground/80 hover:bg-muted"
                  )}
                >
                  {isNext ? "Start" : "Open"} <TbArrowRight size={13} />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
