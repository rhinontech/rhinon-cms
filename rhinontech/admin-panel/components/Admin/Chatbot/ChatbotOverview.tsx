"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { TbCircleCheck, TbClockHour4, TbMessages, TbPlugConnected, TbSchool, TbBrush } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch } from "@/lib/api";
import { timeAgo } from "@/lib/dates";
import { useCurrentSite, useModuleBase } from "@/lib/sites";
import { CopyButton, LoadingRows, Notice, Pill, SettingsCard, SettingsFrame, Spinner } from "@/components/Admin/Settings/parts";
import { InstallGuide } from "./InstallGuide";
import { errorText, useChatbot, useChatEvents, type Chatbot } from "./chatbotApi";


export function ChatbotOverview() {
  const base = useModuleBase();
  const confirm = useConfirm();
  const { site } = useCurrentSite();
  const { has } = usePermissions();
  const canEdit = has("chatbot:write");
  const { state, error, reload, save, setState } = useChatbot();
  const [busy, setBusy] = useState(false);

  // The snippet going live flips "Waiting for your site" without a refresh.
  useChatEvents({
    "chatbot:installed": () => void reload(),
    "chatbot:training": (e: { chatbotId: string; status: Chatbot["trainingStatus"]; progress: number; message: string }) =>
      setState((prev) =>
        prev?.chatbot && prev.chatbot.id === e.chatbotId
          ? { ...prev, chatbot: { ...prev.chatbot, trainingStatus: e.status, trainingProgress: e.progress, trainingMessage: e.message } }
          : prev
      ),
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
      description: "Its training, every conversation and the install snippet are deleted. Leads it captured stay in the CRM. This cannot be undone.",
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

  const bot = state?.chatbot ?? null;

  return (
    <SettingsFrame title="Chatbot" description={site ? `The website assistant for ${site.name}` : undefined}>
      {error && <Notice tone="danger">{error}</Notice>}
      {!state && !error && <LoadingRows rows={4} />}

      {state && !bot && (
        <SettingsCard
          testId="chatbot-empty"
          title="Add a chatbot to your website"
          description="It answers visitors from your own pages and documents, collects their details into the CRM, and hands them to your team when they want a person."
        >
          {state.plan.blockedReason ? (
            <Notice tone="warning" testId="chatbot-plan-blocked">{state.plan.blockedReason}</Notice>
          ) : canEdit ? (
            <Button onClick={create} disabled={busy} data-testid="create-chatbot">
              {busy ? <Spinner /> : <TbMessages size={16} />} Create chatbot
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Ask a workspace admin to create one.</p>
          )}
        </SettingsCard>
      )}

      {bot && (
        <>
          <div className="grid gap-3 sm:grid-cols-3" data-testid="chatbot-status">
            <StatusTile
              icon={<TbPlugConnected size={18} />}
              label="Installed"
              value={bot.installedAt ? `Since ${timeAgo(bot.installedAt)}` : "Waiting for your site"}
              ok={!!bot.installedAt}
            />
            <StatusTile
              icon={<TbSchool size={18} />}
              label="Training"
              value={
                bot.trainingStatus === "training"
                  ? `${bot.trainingProgress}% — ${bot.trainingMessage ?? "training"}`
                  : bot.lastTrainedAt
                    ? `Last trained ${timeAgo(bot.lastTrainedAt)}`
                    : "Not trained yet"
              }
              ok={!!bot.lastTrainedAt && bot.trainingStatus !== "failed"}
            />
            <StatusTile
              icon={<TbMessages size={18} />}
              label="On your site"
              value={bot.isActive ? "Showing to visitors" : "Hidden"}
              ok={bot.isActive}
            />
          </div>

          {!bot.lastTrainedAt && (
            <Notice tone="info" testId="train-first">
              Until it is trained, the bot can only say it doesn&apos;t know.{" "}
              <Link href={`${base}/training`} className="font-medium underline underline-offset-2">Add your website or documents →</Link>
            </Notice>
          )}

          <SettingsCard
            title="Install on your website"
            description="One line, on every page. The bot appears in the bottom-right corner."
          >
            <div className="relative rounded-lg border border-border bg-card" data-testid="snippet-box">
              <pre className="whitespace-pre-wrap break-all p-3 pr-24 text-xs leading-relaxed" data-testid="snippet"><code>{state?.snippet}</code></pre>
              <CopyButton text={state?.snippet ?? ""} label="Snippet" testId="copy-snippet" className="absolute right-2 top-2 bg-card" />
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              {bot.installedAt ? (
                <Pill tone="green"><TbCircleCheck size={12} /> Seen on your site</Pill>
              ) : (
                <Pill tone="amber"><TbClockHour4 size={12} /> Not seen yet — this updates by itself once a page with the snippet loads</Pill>
              )}
            </div>
          </SettingsCard>

          <SettingsCard
            title="Step-by-step for your platform"
            description="Pick what your site is built with for the exact file and code."
          >
            <InstallGuide src={state?.widgetUrl ?? ""} apiUrl={state?.apiUrl ?? ""} appId={bot.publicId} />
          </SettingsCard>

          <SettingsCard
            title="Show on your website"
            description="Turn it off to hide the bot from visitors without removing the snippet. Training and chats are kept."
            actions={<Switch checked={bot.isActive} onCheckedChange={toggleActive} disabled={!canEdit} data-testid="toggle-active" />}
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <QuickLink href={`${base}/chats`} icon={<TbMessages size={18} />} title="Live chats" body="Watch conversations and take over from the bot." />
            <QuickLink href={`${base}/training`} icon={<TbSchool size={18} />} title="Training" body="Websites, documents and notes it answers from." />
            <QuickLink href={`${base}/appearance`} icon={<TbBrush size={18} />} title="Appearance" body="Name, colours, greeting and tone." />
          </div>

          {canEdit && (
            <SettingsCard tone="danger" title="Delete chatbot" description="Removes its training, conversations and snippet for this brand.">
              <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={remove} data-testid="delete-chatbot">
                Delete chatbot
              </Button>
            </SettingsCard>
          )}
        </>
      )}
    </SettingsFrame>
  );
}

function StatusTile({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-xl glass-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className={ok ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>{icon}</span>
        {label}
      </div>
      <p className="mt-1.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function QuickLink({ href, icon, title, body }: { href: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link href={href} className="rounded-xl glass-card p-4 transition-colors hover:border-foreground/20">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </Link>
  );
}
