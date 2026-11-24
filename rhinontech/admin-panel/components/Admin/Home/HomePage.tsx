"use client";

import { track } from "@/lib/track";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import {
  TbBriefcase, TbCalendarOff, TbCheckbox, TbClockHour4, TbCurrencyRupee, TbFileCertificate, TbInbox, TbMessageCircle,
  TbMoonStars, TbReceipt, TbSpeakerphone, TbSunHigh, TbSunrise, TbTargetArrow, TbTicket, TbUserPlus,
} from "react-icons/tb";
import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { apiFetch } from "@/lib/api";
import { usePermissions } from "@/context/PermissionsContext";
import { SITE_SCOPED_MODULES, useActiveBrand, type SiteScopedModule } from "@/lib/sites";
import { MODULES, NAV_SECTIONS, entryRoute, moduleTone } from "@/components/Admin/Common/navConfig";
import { selectUnreadTotal, useTeamChat } from "@/components/Admin/Chat/store";
import { AttentionList, TeamPulse, TodayPanel, WorkspaceLauncher, type AttentionRow, type LauncherTile } from "./HomeSections";
import { GoalQuestion, SetupChecklist, setupComplete } from "./SetupChecklist";
import type { DashboardStats, Goal, HomeSummary, SetupStep } from "./types";

const LAUNCHER_KEY = "rhinon.home.launcher";

function greeting(name: string): { text: string; icon: React.ReactNode } {
  const h = new Date().getHours();
  const first = name.trim().split(/\s+/)[0] || "there";
  if (h < 5) return { text: `Working late, ${first}`, icon: <TbMoonStars size={22} className="text-indigo-400" /> };
  if (h < 12) return { text: `Good morning, ${first}`, icon: <TbSunrise size={22} className="text-amber-400" /> };
  if (h < 17) return { text: `Good afternoon, ${first}`, icon: <TbSunHigh size={22} className="text-yellow-400" /> };
  return { text: `Good evening, ${first}`, icon: <TbMoonStars size={22} className="text-indigo-400" /> };
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * Home: open the app, see what needs you, and get to it in one click.
 *
 * It replaced a dashboard built for HR (headcount, payroll total, birthdays)
 * that pointed nowhere. Now, from the top: quick actions for this person's
 * role, the setup checklist for a new workspace's owner, everything waiting on
 * them across modules, their day, and every module laid out the way the
 * sidebar and the website group them.
 */
function HomeContent() {
  const pathname = usePathname();
  const role = pathname.split("/")[1] || "";
  const { has, isOwner, effectiveRoleSlug, fullName, ready } = usePermissions();
  const { slug: brandSlug } = useActiveBrand();
  const unreadChat = useTeamChat(selectUnreadTotal);

  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [clockBusy, setClockBusy] = useState(false);
  const [skippedGoal, setSkippedGoal] = useState(false);
  const [launcherFolded, setLauncherFolded] = useState(false);
  const [today, setToday] = useState("");

  const hrefFor = (moduleKey: string, rest = "") => {
    const scoped = SITE_SCOPED_MODULES.includes(moduleKey as SiteScopedModule);
    const base = scoped && brandSlug ? `/${role}/${moduleKey}/${brandSlug}` : `/${role}/${moduleKey}`;
    return rest ? `${base}/${rest}` : base;
  };

  const loadStats = useCallback(() => {
    // Attendance and the team's dates still come from the long-standing stats
    // endpoint (the mobile app reads it too); a failure there only hides them.
    apiFetch<DashboardStats>("/dashboard/stats").then(setStats).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    apiFetch<HomeSummary>("/home/summary")
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load your home screen"))
      .finally(() => setLoading(false));
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    load();
    setToday(new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }));
    try {
      setLauncherFolded(window.localStorage.getItem(LAUNCHER_KEY) === "folded");
    } catch {
      /* storage blocked: the launcher stays open */
    }
  }, [load]);

  const toggleLauncher = () => {
    setLauncherFolded((folded) => {
      try {
        window.localStorage.setItem(LAUNCHER_KEY, folded ? "open" : "folded");
      } catch {
        /* ignore */
      }
      return !folded;
    });
  };

  const clockAction = async (path: string) => {
    setClockBusy(true);
    try {
      await apiFetch(path, { method: "POST" });
    } catch {
      /* already in that state, or not allowed: the refresh shows the truth */
    } finally {
      setClockBusy(false);
      loadStats();
    }
  };

  /* -------- Needs your attention: most urgent first -------- */
  const a = summary?.attention ?? {};
  const rows: AttentionRow[] = [];
  const add = (key: string, count: number | undefined, label: (n: number) => string, action: string, href: string, icon: IconType, toneKey: string) => {
    if (count && count > 0) rows.push({ key, count, label: label(count), action, href, icon, tone: moduleTone(toneKey) });
  };
  const approvals = `/${role}/approvals`;
  const myTasks = `/${role}/work/tasks?scope=my`;
  add("chats", a.chatsWaiting, (n) => plural(n, "website visitor waiting for a reply", "website visitors waiting for a reply"), "Answer", hrefFor("chatbot", "chats"), TbMessageCircle, "chatbot");
  add("leave", a.leaveApprovals, (n) => plural(n, "leave request to approve", "leave requests to approve"), "Review", approvals, TbCalendarOff, "attendance");
  add("attendance", a.attendanceApprovals, (n) => plural(n, "attendance correction to approve", "attendance corrections to approve"), "Review", approvals, TbClockHour4, "attendance");
  add("reimbursements", a.reimbursementApprovals, (n) => plural(n, "reimbursement claim to review", "reimbursement claims to review"), "Review", approvals, TbReceipt, "payroll");
  add("overdue", a.tasksOverdue, (n) => plural(n, "overdue task", "overdue tasks"), "See tasks", myTasks, TbCheckbox, "work");
  add("inbox", a.inboxUnread, (n) => plural(n, "unread email in your Inbox", "unread emails in your Inbox"), "Open", hrefFor("inbox"), TbInbox, "inbox");
  add("tickets", a.ticketsAssigned, (n) => plural(n, "open ticket assigned to you", "open tickets assigned to you"), "Open", hrefFor("chatbot", "tickets"), TbTicket, "chatbot");
  add("due", a.tasksDueToday, (n) => plural(n, "task due today", "tasks due today"), "See tasks", myTasks, TbCheckbox, "work");
  add("sign", a.documentsToSign, (n) => plural(n, "document waiting for your signature", "documents waiting for your signature"), "Open", `/${role}/documents`, TbFileCertificate, "documents");
  add("deals", a.dealsPastClose, (n) => plural(n, "of your deals is past its close date", "of your deals are past their close date"), "Update", hrefFor("crm", "deals"), TbCurrencyRupee, "crm");

  /* -------- Your workspace: every module, grouped like the sidebar -------- */
  const l = summary?.launcher ?? {};
  const metric = (key: string): string | undefined => {
    const n = key === "chat" ? unreadChat : l[key];
    // A zero says nothing useful on a tile; it only adds noise.
    if (!n) return undefined;
    switch (key) {
      case "crm": return `${n} open ${plural(n, "deal", "deals")}`;
      case "outreach": return `${n} live ${plural(n, "campaign", "campaigns")}`;
      case "inbox": return `${n} unread`;
      case "chatbot": return `${n} ${plural(n, "chat", "chats")} today`;
      case "work": return `${n} open ${plural(n, "task", "tasks")}`;
      case "chat": return `${n} unread`;
      case "meetings": return `${n} today`;
      case "employees": return `${n} ${plural(n, "person", "people")}`;
      case "attendance": return `${n} in today`;
      default: return undefined;
    }
  };
  const launcherSections = NAV_SECTIONS.map((section) => ({
    key: section.key,
    label: section.label,
    tiles: section.items
      .filter((entry) => has(...entry.permissions))
      .map((entry): LauncherTile | null => {
        const route = entryRoute(entry, has);
        if (!route) return null;
        return {
          key: entry.key,
          label: MODULES[entry.key].label,
          description: entry.description,
          href: hrefFor(route),
          icon: MODULES[entry.key].icon,
          tone: moduleTone(entry.key),
          metric: metric(entry.key),
        };
      })
      .filter((tile): tile is LauncherTile => tile !== null),
  })).filter((section) => section.tiles.length > 0);

  /* -------- Quick actions: the four most likely first moves for this person -------- */
  const setup = summary?.setup ?? null;
  const goal: Goal | null = setup?.goal ?? null;
  const actions: Record<string, { label: string; href: string; icon: IconType } | null> = {
    lead: has("crm:write") ? { label: "Add a lead", href: `${hrefFor("crm")}?new=1`, icon: TbTargetArrow } : null,
    campaign: has("outreach:write") ? { label: "New campaign", href: hrefFor("outreach", "campaigns"), icon: TbSpeakerphone } : null,
    project: has("work:write") ? { label: "New project", href: `/${role}/work/projects?new=1`, icon: TbBriefcase } : null,
    invite: has("employees:write") ? { label: "Invite a teammate", href: `/${role}/employees?invite=1`, icon: TbUserPlus } : null,
    leave: has("leave:read") && effectiveRoleSlug !== "superadmin" ? { label: "Request leave", href: `/${role}/leave/requests`, icon: TbCalendarOff } : null,
    tasks: has("work:read") ? { label: "My tasks", href: myTasks, icon: TbCheckbox } : null,
  };
  const order: Record<Goal | "none", string[]> = {
    sell: ["lead", "campaign", "invite", "project"],
    deliver: ["project", "lead", "invite", "tasks"],
    team: ["invite", "leave", "project", "tasks"],
    none: ["lead", "project", "leave", "tasks", "invite", "campaign"],
  };
  const quickActions = order[goal ?? "none"].map((key) => actions[key]).filter((x): x is NonNullable<typeof x> => !!x).slice(0, 4);

  /* -------- Setup checklist (owner of a new workspace) -------- */
  const showSetup = !!setup && isOwner && !setup.dismissed && !setupComplete(setup);
  const showGoalQuestion = showSetup && setup?.goal === null && !skippedGoal;
  const stepHref = (step: SetupStep): string | null => {
    switch (step) {
      case "verifyEmail": return null;
      case "inviteTeam": return `/${role}/employees?invite=1`;
      case "importContacts": return hrefFor("crm");
      case "firstCampaign": return hrefFor("outreach", "campaigns");
      case "firstProject": return `/${role}/work/projects?new=1`;
      case "installChatbot": return hrefFor("chatbot");
      case "leaveTypes": return `/${role}/leave/policies`;
    }
  };
  const patchSetup = (patch: Partial<NonNullable<HomeSummary["setup"]>>) =>
    setSummary((s) => (s && s.setup ? { ...s, setup: { ...s.setup, ...patch } } : s));

  const clock =
    has("attendance:read") && effectiveRoleSlug !== "superadmin" && stats
      ? {
          attendance: stats.todayAttendance,
          busy: clockBusy,
          onClockIn: () => clockAction("/attendance/clock-in"),
          onClockOut: () => clockAction("/attendance/clock-out"),
          onToggleBreak: () => {
            const att = stats.todayAttendance;
            const onBreak = !!att?.breaks?.length && !att.breaks[att.breaks.length - 1].end;
            clockAction(onBreak ? "/attendance/break-end" : "/attendance/break-start");
          },
        }
      : null;

  const name = stats?.currentUser.fullName || fullName;
  const hello = greeting(name);

  return (
    <div className="h-full w-full overflow-auto rounded-xl glass-panel">
      <div className="mx-auto max-w-[1200px] space-y-4 p-4 sm:space-y-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {hello.icon}
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{name || ready ? hello.text : "Loading…"}</h1>
              <p className="text-sm text-muted-foreground">{today ? `${today} · here is what needs you` : "Here is what needs you"}</p>
            </div>
          </div>
          {quickActions.length > 0 && (
            <div className="flex flex-wrap gap-2" data-testid="quick-actions">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href} prefetch={false} onClick={() => track("home_quick_action", { action: action.label })} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/70 px-3 py-1.5 text-xs font-medium text-foreground/90 shadow-xs transition-colors hover:bg-card">
                    <Icon size={15} className="text-muted-foreground" /> {action.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {showGoalQuestion && <GoalQuestion onAnswer={(g) => patchSetup({ goal: g })} onSkip={() => setSkippedGoal(true)} />}
        {showSetup && setup && <SetupChecklist setup={setup} hrefFor={stepHref} onDismiss={() => patchSetup({ dismissed: true })} />}

        <AttentionList rows={rows} loading={loading && !summary} error={summary ? "" : error} onRetry={load} />

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <TodayPanel
              loading={loading && !summary}
              clock={clock}
              schedule={summary?.today.workSchedule ?? null}
              meetings={summary?.today.meetings ?? []}
              tasks={summary?.today.tasks ?? []}
              taskHref={(t) => (t.projectId ? `/${role}/work/projects/${t.projectId}?task=${t.id}` : myTasks)}
              leaveBalance={summary?.today.leaveBalance ?? null}
              leaveHref={has("leave:read") ? `/${role}/leave/requests` : null}
            />
            {summary?.pulse && stats && (
              <TeamPulse pulse={summary.pulse} birthdays={stats.birthdays} anniversaries={stats.anniversaries} attendanceHref={`/${role}/attendance`} />
            )}
          </div>
          <div className="lg:col-span-3">
            {launcherSections.length > 0 && <WorkspaceLauncher sections={launcherSections} collapsed={launcherFolded} onToggle={toggleLauncher} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  return (
    <AdminDashboardShell>
      <HomeContent />
    </AdminDashboardShell>
  );
}
