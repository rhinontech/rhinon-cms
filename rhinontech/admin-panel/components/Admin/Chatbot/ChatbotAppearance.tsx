"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { TbDeviceFloppy, TbPhoto, TbTrash, TbUpload } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePermissions } from "@/context/PermissionsContext";
import { API_URL, apiUpload } from "@/lib/api";
import { useModuleBase } from "@/lib/sites";
import { cn } from "@/lib/utils";
import { LoadingRows, Notice, Spinner } from "@/components/Admin/Settings/parts";
import { PageShell, Panel, Segmented } from "./ui";
import { errorText, useChatbot, type ChatbotConfig } from "./chatbotApi";
import { WidgetPreview } from "./WidgetPreview";
import { ImageCropDialog } from "./ImageCropDialog";

const SWATCHES = ["#1c1917", "#1d4ed8", "#4f46e5", "#7c3aed", "#db2777", "#dc2626", "#ea580c", "#16a34a", "#0d9488"];
/** The widget's tabs. Voice is not offered. */
const NAV_OPTIONS = [
  { value: "Home", hint: "Greeting, start a chat, tickets" },
  { value: "Messages", hint: "The visitor's past chats" },
  { value: "Help", hint: "Help-center articles" },
] as const;

/** The widget's built-in images (served by the backend next to the widget). */
const DEFAULT_IMAGES = {
  primaryLogo: `${API_URL}/widget/assets/logo-light.png`,
  secondaryLogo: `${API_URL}/widget/assets/logo-dark.png`,
  backgroundImage: `${API_URL}/widget/assets/background.jpg`,
};

type PreviewPage = "Home" | "Chats" | "Help";
/** Which preview screen shows the setting being changed, as Saleszium did. */
const PAGE_FOR: Partial<Record<keyof ChatbotConfig, PreviewPage>> = {
  primaryColor: "Home",
  isBgFade: "Home",
  isBackgroundImage: "Home",
  backgroundImage: "Home",
  primaryLogo: "Home",
  greetings: "Home",
  navigationOptions: "Home",
  chatbotName: "Chats",
  secondaryColor: "Chats",
  isChatHistory: "Chats",
  secondaryLogo: "Help",
};

/** Images the widget ships with — shown as "none set" here. */
const isBuiltIn = (url?: string) => !url || url.includes("/widget/assets/");

export function ChatbotAppearance() {
  const base = useModuleBase();
  const { has } = usePermissions();
  const canEdit = has("chatbot:write");
  const { state, error, save } = useChatbot();
  const [draft, setDraft] = useState<ChatbotConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<PreviewPage>("Home");

  const bot = state?.chatbot ?? null;
  useEffect(() => {
    if (bot && !draft) setDraft(bot.config);
  }, [bot, draft]);

  const dirty = useMemo(() => !!bot && !!draft && JSON.stringify(bot.config) !== JSON.stringify(draft), [bot, draft]);
  const set = <K extends keyof ChatbotConfig>(key: K, value: ChatbotConfig[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    // Show the screen this setting changes.
    const target = PAGE_FOR[key];
    if (target) setPage(target);
  };

  const submit = async () => {
    if (!draft) return;
    if (!(draft.navigationOptions ?? ["Home"]).length) return void toast.error("Keep at least one menu item.");
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
  const nav = draft?.navigationOptions?.filter((o) => o !== "Voice") ?? ["Home", "Messages", "Help"];
  const previewPages = (["Home", "Chats", "Help"] as const).filter((p) => (p === "Chats" ? nav.includes("Messages") : nav.includes(p)));

  return (
    <PageShell
      flush
      title="Appearance"
      subtitle="How the chatbot looks and sounds on your website."
      actions={
        canEdit && (
          <Button onClick={submit} disabled={!dirty || saving} data-testid="save-appearance">
            {saving ? <Spinner /> : <TbDeviceFloppy size={16} />} {dirty ? "Save changes" : "Saved"}
          </Button>
        )
      }
    >
      {error && <div className="p-5"><Notice tone="danger">{error}</Notice></div>}
      {(!draft || !bot) && !error && <div className="p-5"><LoadingRows rows={5} /></div>}

      {draft && bot && (
        <div className="flex h-full min-h-0">
          {/* Settings — scrolls on its own */}
          <div className="min-w-0 flex-1 overflow-y-auto" data-testid="appearance-settings">
            <fieldset className="mx-auto flex max-w-3xl flex-col gap-5 p-5 sm:p-7" disabled={!canEdit}>
              <Panel title="Identity" description="The name visitors see in the chat header.">
                <div className="grid gap-4">
                  <Field label="Chatbot name">
                    <Input data-testid="bot-name" value={draft.chatbotName ?? ""} maxLength={40} onChange={(e) => set("chatbotName", e.target.value)} />
                  </Field>
                  <ToggleRow
                    label="Chat history"
                    hint="Returning visitors see a list of their past conversations before starting a new one."
                    checked={!!draft.isChatHistory}
                    onChange={(v) => set("isChatHistory", v)}
                  />
                </div>
              </Panel>

              <Panel title="Brand logos" description="PNG, SVG or JPG up to 10 MB. Transparent backgrounds look best.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ImageField
                    label="Primary logo"
                    hint="Home header. Also the launcher, unless you set a launcher icon."
                    value={isBuiltIn(draft.primaryLogo) ? undefined : draft.primaryLogo}
                    defaultSrc={DEFAULT_IMAGES.primaryLogo}
                    aspect={1}
                    dark
                    onChange={(url) => set("primaryLogo", url ?? "")}
                    testId="primary-logo"
                  />
                  <ImageField
                    label="Secondary logo"
                    hint="Help center and article pages, on a light background."
                    value={isBuiltIn(draft.secondaryLogo) ? undefined : draft.secondaryLogo}
                    defaultSrc={DEFAULT_IMAGES.secondaryLogo}
                    onChange={(url) => set("secondaryLogo", url ?? "")}
                    testId="secondary-logo"
                  />
                  <ImageField
                    label="Launcher icon"
                    hint="Shown inside the launcher button, on your primary colour. A white logo on a transparent background works best."
                    value={draft.launcherIcon || undefined}
                    defaultSrc={`${API_URL}/widget/assets/bot.png`}
                    aspect={1}
                    onChange={(url) => set("launcherIcon", url ?? "")}
                    testId="launcher-icon"
                  />
                </div>
              </Panel>

              <Panel title="Colours & theme">
                <div className="flex flex-col gap-5">
                  <Field label="Primary colour" hint="Header, buttons and the visitor's messages.">
                    <ColourPicker value={draft.primaryColor ?? "#1c1917"} onChange={(c) => set("primaryColor", c)} swatches={SWATCHES} />
                  </Field>
                  <Field label="Secondary colour" hint="The bot's message bubbles in the chat (shown with dark text, so lighter colours read best).">
                    <ColourPicker value={draft.secondaryColor ?? "#f3f6ff"} onChange={(c) => set("secondaryColor", c)} swatches={["#ffffff", "#f3f6ff", "#f5f5f4", "#ecfdf5", "#fef3c7", "#fce7f3"]} />
                  </Field>
                  <Field label="Theme">
                    <Segmented
                      value={(draft.theme as "dark" | "light" | "system") ?? "dark"}
                      onChange={(v) => set("theme", v)}
                      options={[
                        { value: "light", label: "Light" },
                        { value: "dark", label: "Dark" },
                        { value: "system", label: "Match device" },
                      ]}
                    />
                  </Field>
                </div>
              </Panel>

              <Panel title="Home background">
                <div className="flex flex-col gap-4">
                  <ToggleRow
                    label="Background image"
                    hint="Use a photo behind the greeting instead of the primary colour."
                    checked={!!draft.isBackgroundImage}
                    onChange={(v) => set("isBackgroundImage", v)}
                    testId="toggle-bg-image"
                  />
                  {draft.isBackgroundImage && (
                    <ImageField
                      label="Background image"
                      hint="Landscape, at least 800 px wide. Text sits on top, so darker images read best."
                      value={isBuiltIn(draft.backgroundImage) ? undefined : draft.backgroundImage || undefined}
                      defaultSrc={DEFAULT_IMAGES.backgroundImage}
                      onChange={(url) => set("backgroundImage", url ?? "")}
                      wide
                      testId="bg-image"
                    />
                  )}
                  <ToggleRow
                    label="Background fade"
                    hint="Fade the bottom of the header into the page instead of a hard edge."
                    checked={draft.isBgFade !== false}
                    onChange={(v) => set("isBgFade", v)}
                    testId="toggle-bg-fade"
                  />
                </div>
              </Panel>

              <Panel title="Greeting" description="What visitors read when they open the chat.">
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Greeting">
                      <Input value={greetings[0] ?? ""} maxLength={60} placeholder="Hi there 👋" data-testid="greeting-0"
                        onChange={(e) => set("greetings", [e.target.value, greetings[1] ?? ""])} />
                    </Field>
                    <Field label="Introduction">
                      <Input value={greetings[1] ?? ""} maxLength={60} placeholder="How can we help?" data-testid="greeting-1"
                        onChange={(e) => set("greetings", [greetings[0] ?? "", e.target.value])} />
                    </Field>
                  </div>
                  <Field label="Pop-up message" hint="Shown beside the button before the chat is opened. Leave empty for none.">
                    <Input value={draft.popupMessage ?? ""} maxLength={120} placeholder="Questions? Ask me anything." onChange={(e) => set("popupMessage", e.target.value)} />
                  </Field>
                </div>
              </Panel>

              <Panel title="Menu" description="Which tabs appear at the bottom of the chat window.">
                <div className="grid gap-2 sm:grid-cols-3" data-testid="nav-options">
                  {NAV_OPTIONS.map((o) => {
                    const on = nav.includes(o.value);
                    return (
                      <label
                        key={o.value}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors",
                          on ? "border-foreground/40 bg-muted/50" : "border-border hover:bg-muted/30"
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 accent-foreground"
                          checked={on}
                          onChange={(e) => {
                            const next = e.target.checked ? [...nav, o.value] : nav.filter((n) => n !== o.value);
                            const ordered = NAV_OPTIONS.map((n) => n.value).filter((v) => next.includes(v));
                            if (!ordered.length) return void toast.error("Keep at least one menu item.");
                            set("navigationOptions", ordered);
                          }}
                        />
                        <span>
                          <span className="block text-sm font-medium">{o.value}</span>
                          <span className="block text-xs text-muted-foreground">{o.hint}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="How it answers" description="Instructions for the AI on top of its training. It still only states facts it was trained on.">
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
          </div>

          {/* Preview — stays put while the settings scroll */}
          <aside className="hidden w-[480px] shrink-0 flex-col border-l border-border/70 bg-muted/20 p-5 lg:flex" data-testid="appearance-preview">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live preview</p>
              <Segmented size="sm" value={previewPages.includes(page) ? page : previewPages[0]} onChange={setPage} options={previewPages.map((p) => ({ value: p, label: p }))} />
            </div>
            <div className="min-h-0 flex-1">
              <WidgetPreview appId={bot.publicId} config={{ ...draft, navigationOptions: nav }} forms={bot.forms} page={previewPages.includes(page) ? page : previewPages[0]} />
            </div>
            {dirty && <p className="mt-3 text-center text-xs text-muted-foreground">Preview shows unsaved changes — click Save to publish them.</p>}
          </aside>
        </div>
      )}
    </PageShell>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[13px]">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange, testId }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; testId?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} data-testid={testId} />
    </label>
  );
}

function ColourPicker({ value, onChange, swatches }: { value: string; onChange: (c: string) => void; swatches: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {swatches.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Use ${c}`}
          onClick={() => onChange(c)}
          className={cn("size-7 rounded-full border transition-transform hover:scale-110", value.toLowerCase() === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "border-border")}
          style={{ background: c }}
        />
      ))}
      <label className="ml-1 flex items-center gap-2 rounded-lg border border-border px-2 py-1">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="size-6 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="Custom colour" />
        <Input value={value} onChange={(e) => /^#[0-9a-f]{0,6}$/i.test(e.target.value) && onChange(e.target.value)} className="h-7 w-24 border-0 px-1 font-mono text-xs shadow-none focus-visible:ring-0" />
      </label>
    </div>
  );
}

function ImageField({
  label,
  hint,
  value,
  defaultSrc,
  onChange,
  aspect,
  dark,
  wide,
  testId,
}: {
  label: string;
  hint?: string;
  /** The customer's own image, or undefined when the default is in use. */
  value?: string;
  defaultSrc: string;
  onChange: (url: string | undefined) => void;
  /** Lock the crop shape (1 = square). */
  aspect?: number;
  /** Show on a dark tile (for white logos). */
  dark?: boolean;
  wide?: boolean;
  testId?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ src: string; name: string } | null>(null);

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) return void toast.error("Choose an image file.");
    if (file.size > 10 * 1024 * 1024) return void toast.error("That image is over 10 MB.");
    // SVGs can't be cropped on a canvas without losing quality — upload as-is.
    if (file.type === "image/svg+xml") return void upload(file);
    const reader = new FileReader();
    reader.onload = () => setPending({ src: String(reader.result), name: file.name });
    reader.readAsDataURL(file);
    if (input.current) input.current.value = "";
  };

  const upload = async (file: File) => {
    try {
      const res = await apiUpload<{ url: string }>("/chatbots/upload-image", file, "image");
      onChange(res.url);
      setPending(null);
      toast.success(`${label} updated — save to publish`);
    } catch (err) {
      toast.error(errorText(err, "Upload failed"));
    }
  };

  const shown = value || defaultSrc;
  return (
    <div className="grid gap-1.5" data-testid={testId}>
      <Label className="text-[13px]">{label}</Label>
      <div className={cn("flex items-center gap-3 rounded-xl border border-border p-3", wide && "flex-col items-stretch")}>
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg",
            dark ? "bg-neutral-800" : "bg-[repeating-conic-gradient(#e5e7eb_0_25%,transparent_0_50%)] bg-[length:12px_12px]",
            wide ? "h-28 w-full" : "size-16"
          )}
        >
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className={cn("h-full w-full", wide ? "object-cover" : "object-contain p-1.5")} />
          ) : (
            <TbPhoto size={20} className="text-muted-foreground" />
          )}
          {!value && <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">Default</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={input} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
            <TbUpload size={14} /> {value ? "Replace" : "Upload your own"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onChange(undefined)}>
              <TbTrash size={14} /> Reset to default
            </Button>
          )}
        </div>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <ImageCropDialog
        src={pending?.src ?? null}
        fileName={pending?.name ?? "image.png"}
        aspect={aspect}
        title={`Crop ${label.toLowerCase()}`}
        onCancel={() => setPending(null)}
        onCropped={upload}
      />
    </div>
  );
}
