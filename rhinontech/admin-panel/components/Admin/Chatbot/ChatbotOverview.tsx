"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  TbArrowRight, TbBrush, TbCheck, TbCode, TbEye, TbEyeOff, TbMessageChatbot, TbMessages, TbSchool, TbTrash, TbUserCheck, TbUsers,
} from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch } from "@/lib/api";
import { timeAgo } from "@/lib/dates";
import { useCurrentSite, useModuleBase } from "@/lib/sites";
import { cn } from "@/lib/utils";
import { CopyButton, LoadingRows, Notice, Spinner } from "@/components/Admin/Settings/parts";
import { InstallGuide } from "./InstallGuide";
import { Chip, EmptyState, PageShell, Panel, Stat } from "./ui";
import { errorText, useChatbot, useChatEvents, type Chatbot } from "./chatbotApi";

interface Stats {
  chatsToday: number;
  chatsWeek: number;
  leadsWeek: number;
  waiting: number;
  answersToday: number;
  onlineNow: number;
}

export function ChatbotOverview() {
  const base = useModuleBase();
  const confirm = useConfirm();
  const { site } = useCurrentSite();
  const { has } = usePermissions();
  const canEdit = has("chatbot:write");
  const { state, error, reload, save, setState } = useChatbot();
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(false);
  const [installMode, setInstallMode] = useState<"tag" | "guide">("tag");

  const bot = state?.chatbot ?? null;

  const loadStats = useCallback(() => {
    apiFetch<Stats>("/chatbots/stats").then(setStats).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (bot) loadStats();
  }, [bot?.id, loadStats]); // eslint-disable-line react-hooks/exhaustive-deps

  useChatEvents({
    "chatbot:installed": () => void reload(),
    "chatbot:training": (e: { chatbotId: string; status: Chatbot["trainingStatus"]; progress: number; message: string }) =>
      setState((prev) =>
        prev?.chatbot && prev.chatbot.id === e.chatbotId
          ? { ...prev, chatbot: { ...prev.chatbot, trainingStatus: e.status, trainingProgress: e.progress, trainingMessage: e.message } }
          : prev
      ),
    "chat:visitor": () => loadStats(),
    "chat:conversation": () => loadStats(),
  });

  const create = async () => {
    setBusy(true);
    try {
      await apiFetch("/chatbots", { method: "POST", body: JSON.stringify({ config: { chatbotName: site?.name ? `${site.name} Assistant` : "Assistant" } }) });
      await reload();
      toast.success("Chatbot created — train it next");
    } catch (err) {
      toast.error(errorText(err, "Could not create the chatbot"));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (isActive: boolean) => {
    try {
      await save({ isActive });
      toast.success(isActive ? "Chatbot is live on your site" : "Chatbot hidden from your site");
    } catch (err) {
      toast.error(errorText(err, "Could not update the chatbot"));
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: "Delete this chatbot?",
      description: "Its training, every conversation and the install code are deleted. Leads it captured stay in the CRM. This cannot be undone.",
      confirmLabel: "Delete chatbot",
      destructive: true,
    });
    if (!ok) return;
    try {
      await apiFetch("/chatbots", { method: "DELETE" });
      await reload();
      toast.success("Chatbot deleted");
    } catch (err) {
      toast.error(errorText(err, "Could not delete the chatbot"));
    }
  };

  const accent = (bot?.config.primaryColor as string) || "#1c1917";
  const customised = !!bot && (!!bot.config.persona || accent.toLowerCase() !== "#1c1917" || !!bot.config.primaryLogo);
  const steps = bot
    ? [
        { done: true, label: "Create your chatbot", href: undefined },
        { done: !!bot.lastTrainedAt, label: "Train it on your website or documents", href: `${base}/training` },
        { done: customised, label: "Make it yours — colour, greeting, tone", href: `${base}/appearance` },
        { done: !!bot.installedAt, label: "Add it to your website", href: "#install" },
      ]
    : [];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <PageShell title="Overview" subtitle={site ? `Website chatbot for ${site.name}` : undefined}>
      {error && <Notice tone="danger">{error}</Notice>}
      {!state && !error && <LoadingRows rows={4} />}

      {state && !bot && (
        <Panel testId="chatbot-empty">
          <EmptyState
            icon={<TbMessageChatbot size={24} />}
            title="Add an AI chatbot to your website"
            body="It answers visitors from your own pages and documents, saves their details to the CRM, and hands them to your team when they want a person."
            action={
              state.plan.blockedReason ? (
                <Notice tone="warning" testId="chatbot-plan-blocked">{state.plan.blockedReason}</Notice>
              ) : canEdit ? (
                <Button size="lg" onClick={create} disabled={busy} data-testid="create-chatbot">
                  {busy ? <Spinner /> : <TbMessageChatbot size={18} />} Create chatbot
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">Ask a workspace admin to create one.</p>
              )
            }
          />
        </Panel>
      )}

      {bot && (
        <>
          {/* Identity */}
          <Panel padded={false} testId="chatbot-hero">
            <div className="flex flex-wrap items-center gap-4 p-6">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: accent }}>
                <TbMessageChatbot size={28} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold tracking-tight">{(bot.config.chatbotName as string) || "Assistant"}</h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {bot.isActive ? <Chip tone="green"><TbEye size={12} /> Showing on your site</Chip> : <Chip><TbEyeOff size={12} /> Hidden</Chip>}
                  {bot.installedAt ? <Chip tone="green"><TbCheck size={12} /> Installed {timeAgo(bot.installedAt)}</Chip> : <Chip tone="amber">Not installed yet</Chip>}
                  {bot.trainingStatus === "training" ? (
                    <Chip tone="blue">Training {bot.trainingProgress}%</Chip>
                  ) : bot.lastTrainedAt ? (
                    <Chip>Trained {timeAgo(bot.lastTrainedAt)}</Chip>
                  ) : (
                    <Chip tone="amber">Not trained</Chip>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" asChild>
                  <Link href={`${base}/training`}><TbMessageChatbot size={16} /> Test it</Link>
                </Button>
                <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Live</span>
                  <Switch checked={bot.isActive} onCheckedChange={toggleActive} disabled={!canEdit} data-testid="toggle-active" />
                </label>
              </div>
            </div>
          </Panel>

          {/* Setup checklist, until everything is done */}
          {doneCount < steps.length && (
            <Panel title="Get set up" description={`${doneCount} of ${steps.length} done`} testId="setup-checklist">
              <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full transition-all" style={{ width: `${(doneCount / steps.length) * 100}%`, background: accent }} />
              </div>
              <ol className="grid gap-2 sm:grid-cols-2">
                {steps.map((s, i) => {
                  const body = (
                    <>
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                          s.done ? "bg-emerald-500 text-white" : "border border-border text-muted-foreground"
                        )}
                      >
                        {s.done ? <TbCheck size={14} /> : i + 1}
                      </span>
                      <span className={cn("flex-1 text-sm", s.done ? "text-muted-foreground line-through decoration-muted-foreground/40" : "font-medium text-foreground")}>{s.label}</span>
                      {!s.done && s.href && <TbArrowRight size={15} className="text-muted-foreground" />}
                    </>
                  );
                  const cls = "flex items-center gap-3 rounded-xl border border-border/70 px-3.5 py-3";
                  return (
                    <li key={s.label}>
                      {!s.done && s.href ? (
                        <a href={s.href} onClick={s.href === "#install" ? () => setInstallMode("tag") : undefined} className={cn(cls, "transition-colors hover:border-foreground/25 hover:bg-muted/40")}>{body}</a>
                      ) : (
                        <div className={cls}>{body}</div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </Panel>
          )}

          {/* Numbers */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="chatbot-stats">
            <Stat icon={<TbUsers size={18} />} tone="green" label="On your site now" value={stats?.onlineNow ?? "—"} hint={<Link href={`${base}/visitors`} className="hover:underline">See live visitors →</Link>} />
            <Stat icon={<TbMessages size={18} />} tone="blue" label="Chats today" value={stats?.chatsToday ?? "—"} hint={stats ? `${stats.chatsWeek} this week` : undefined} />
            <Stat icon={<TbUserCheck size={18} />} tone="violet" label="Leads captured" value={stats?.leadsWeek ?? "—"} hint="Last 7 days" />
            <Stat
              icon={<TbMessageChatbot size={18} />}
              tone={stats?.waiting ? "amber" : "neutral"}
              label={stats?.waiting ? "Waiting for a reply" : "AI answers today"}
              value={stats ? (stats.waiting || stats.answersToday) : "—"}
              hint={stats?.waiting ? <Link href={`${base}/chats`} className="hover:underline">Open live chats →</Link> : "Answered by the bot"}
            />
          </div>

          {/* Install */}
          <div id="install" className="scroll-mt-4">
            <Panel
              icon={<TbCode size={18} />}
              title="Install on your website"
              description="Add it once; it shows on every page in the bottom-right corner."
              actions={
                <div className="inline-flex rounded-lg bg-muted p-0.5 text-xs">
                  {(["tag", "guide"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setInstallMode(m)}
                      className={cn("rounded-md px-2.5 py-1 font-medium", installMode === m ? "bg-background shadow-sm" : "text-muted-foreground")}
                    >
                      {m === "tag" ? "One line" : "By platform"}
                    </button>
                  ))}
                </div>
              }
            >
              {installMode === "tag" ? (
                <>
                  <div className="relative overflow-hidden rounded-xl border border-border bg-muted/40" data-testid="snippet-box">
                    <pre className="whitespace-pre-wrap break-all p-4 pr-24 font-mono text-xs leading-relaxed" data-testid="snippet"><code>{state?.snippet}</code></pre>
                    <CopyButton text={state?.snippet ?? ""} label="Copy" testId="copy-snippet" className="absolute right-3 top-3 bg-background" />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Paste it just before <code className="font-mono">&lt;/body&gt;</code>. Using React, WordPress, Shopify…?{" "}
                    <button type="button" className="font-medium text-foreground underline underline-offset-2" onClick={() => setInstallMode("guide")}>
                      Step-by-step for your platform
                    </button>
                  </p>
                </>
              ) : (
                <InstallGuide src={state?.widgetUrl ?? ""} apiUrl={state?.apiUrl ?? ""} appId={bot.publicId} />
              )}
            </Panel>
          </div>

          {/* Shortcuts */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Shortcut href={`${base}/chats`} icon={<TbMessages size={18} />} title="Live chats" body="Read conversations and take over from the bot." />
            <Shortcut href={`${base}/training`} icon={<TbSchool size={18} />} title="Training" body="The websites, documents and notes it answers from." />
            <Shortcut href={`${base}/appearance`} icon={<TbBrush size={18} />} title="Appearance" body="Name, colour, greeting and tone of voice." />
          </div>

          {canEdit && (
            <Panel
              tone="danger"
              title="Delete chatbot"
              description="Removes its training, conversations and install code for this brand."
              actions={
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={remove} data-testid="delete-chatbot">
                  <TbTrash size={15} /> Delete
                </Button>
              }
            />
          )}
        </>
      )}
    </PageShell>
  );
}

function Shortcut({ href, icon, title, body }: { href: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-2xl border border-[var(--glass-card-border)] bg-[var(--glass-card-solid-bg)] p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/70">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
          {title}
          <TbArrowRight size={14} className="opacity-0 transition-opacity group-hover:opacity-100" />
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </Link>
  );
}
