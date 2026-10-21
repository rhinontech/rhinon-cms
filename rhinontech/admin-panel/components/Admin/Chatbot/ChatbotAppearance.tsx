"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { TbDeviceFloppy } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePermissions } from "@/context/PermissionsContext";
import { useModuleBase } from "@/lib/sites";
import { cn } from "@/lib/utils";
import {LoadingRows, Notice, Spinner } from "@/components/Admin/Settings/parts";
import { PageShell, Panel } from "./ui";
import { errorText, useChatbot, type ChatbotConfig } from "./chatbotApi";
import { WidgetPreview } from "./WidgetPreview";

const SWATCHES = ["#1c1917", "#1d4ed8", "#4f46e5", "#7c3aed", "#db2777", "#dc2626", "#ea580c", "#16a34a", "#0d9488"];

export function ChatbotAppearance() {
  const base = useModuleBase();
  const { has } = usePermissions();
  const canEdit = has("chatbot:write");
  const { state, error, save } = useChatbot();
  const [draft, setDraft] = useState<ChatbotConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<"Home" | "Chats">("Home");

  const bot = state?.chatbot ?? null;
  useEffect(() => {
    if (bot && !draft) setDraft(bot.config);
  }, [bot, draft]);

  const dirty = useMemo(() => !!bot && !!draft && JSON.stringify(bot.config) !== JSON.stringify(draft), [bot, draft]);
  const set = <K extends keyof ChatbotConfig>(key: K, value: ChatbotConfig[K]) => setDraft((d) => (d ? { ...d, [key]: value } : d));

  const submit = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const saved = await save({ config: draft });
      setDraft(saved.config);
      toast.success("Saved — your site shows it on the next page load");
    } catch (err) {
      toast.error(errorText(err, "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  if (state && !bot) {
    return (
      <PageShell title="Appearance">
        <Notice tone="info">
          Create the chatbot first. <Link href={base} className="font-medium underline underline-offset-2">Go to Overview →</Link>
        </Notice>
      </PageShell>
    );
  }

  const greetings = draft?.greetings ?? [];

  return (
    <PageShell
      width="wide"
      title="Appearance"
      subtitle="How the bot looks and sounds on your site."
      actions={
        canEdit && (
          <Button onClick={submit} disabled={!dirty || saving} data-testid="save-appearance">
            {saving ? <Spinner /> : <TbDeviceFloppy size={16} />} Save
          </Button>
        )
      }
    >
      {error && <Notice tone="danger">{error}</Notice>}
      {(!draft || !bot) && !error && <LoadingRows rows={5} />}

      {draft && bot && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
          <fieldset className="flex flex-col gap-4" disabled={!canEdit}>
            <Panel title="Identity">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="bot-name">Bot name</Label>
                  <Input id="bot-name" data-testid="bot-name" value={draft.chatbotName ?? ""} maxLength={40} onChange={(e) => set("chatbotName", e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="bot-logo">Logo URL <span className="font-normal text-muted-foreground">(optional, square works best)</span></Label>
                  <Input id="bot-logo" value={draft.primaryLogo?.includes("/widget/assets/") ? "" : draft.primaryLogo ?? ""} placeholder="https://…/logo.png" onChange={(e) => set("primaryLogo", e.target.value.trim() || undefined)} />
                </div>
              </div>
            </Panel>

            <Panel title="Colours">
              <div className="flex flex-col gap-4">
                <div>
                  <Label>Main colour</Label>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Use ${c}`}
                        onClick={() => set("primaryColor", c)}
                        className={cn("size-7 rounded-full border-2 transition-transform hover:scale-110", draft.primaryColor === c ? "border-foreground" : "border-transparent")}
                        style={{ background: c }}
                      />
                    ))}
                    <input
                      type="color"
                      aria-label="Custom colour"
                      value={draft.primaryColor ?? "#1c1917"}
                      onChange={(e) => set("primaryColor", e.target.value)}
                      className="size-7 cursor-pointer rounded-full border border-border bg-transparent"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5 sm:max-w-xs">
                  <Label htmlFor="bot-theme">Theme</Label>
                  <select
                    id="bot-theme"
                    className="rounded-md border border-border bg-background px-2 py-2 text-sm"
                    value={draft.theme ?? "dark"}
                    onChange={(e) => set("theme", e.target.value as ChatbotConfig["theme"])}
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="system">Match the visitor&apos;s device</option>
                  </select>
                </div>
                <label className="flex items-center justify-between gap-4 text-sm">
                  <span>
                    <span className="font-medium">Background image on the home screen</span>
                    <span className="block text-xs text-muted-foreground">Off uses your main colour instead.</span>
                  </span>
                  <Switch checked={!!draft.isBackgroundImage} onCheckedChange={(v) => set("isBackgroundImage", v)} />
                </label>
              </div>
            </Panel>

            <Panel title="Greeting" description="The two lines visitors see when they open the chat.">
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1].map((i) => (
                  <Input
                    key={i}
                    value={greetings[i] ?? ""}
                    maxLength={60}
                    placeholder={i === 0 ? "Hi there 👋" : "How can we help?"}
                    data-testid={`greeting-${i}`}
                    onChange={(e) => {
                      const next = [...greetings];
                      next[i] = e.target.value;
                      set("greetings", next);
                    }}
                  />
                ))}
              </div>
              <div className="mt-4 grid gap-1.5">
                <Label htmlFor="bot-popup">Pop-up message <span className="font-normal text-muted-foreground">(shown beside the button before the chat is opened)</span></Label>
                <Input id="bot-popup" value={draft.popupMessage ?? ""} maxLength={120} placeholder="Questions? Ask me anything." onChange={(e) => set("popupMessage", e.target.value)} />
              </div>
            </Panel>

            <Panel title="How it answers" description="Instructions for the AI on top of your training. It still only states facts from what it was trained on.">
              <Textarea
                value={draft.persona ?? ""}
                onChange={(e) => set("persona", e.target.value)}
                rows={4}
                maxLength={2000}
                data-testid="persona"
                placeholder="E.g. Friendly and concise. Always suggest booking a call for project quotes. Never discuss competitors."
              />
            </Panel>
          </fieldset>

          <div className="lg:sticky lg:top-0 lg:self-start">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Live preview</p>
              <div className="inline-flex rounded-md border border-border p-0.5 text-xs">
                {(["Home", "Chats"] as const).map((p) => (
                  <button key={p} type="button" onClick={() => setPage(p)} className={cn("rounded px-2 py-0.5", page === p ? "bg-foreground text-background" : "text-muted-foreground")}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <WidgetPreview appId={bot.publicId} config={draft} forms={bot.forms} page={page} />
          </div>
        </div>
      )}
    </PageShell>
  );
}
