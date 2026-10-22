"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { TbArrowDown, TbArrowLeft, TbArrowUp, TbDeviceFloppy, TbPhoto, TbPlayerPause, TbPlus, TbRocket, TbTrash, TbUpload } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch, apiUpload } from "@/lib/api";
import { useModuleBase } from "@/lib/sites";
import { cn } from "@/lib/utils";
import { LoadingRows, Notice, Spinner } from "@/components/Admin/Settings/parts";
import { Chip, PageShell, Panel, Segmented } from "./ui";
import { errorText, useChatbot } from "./chatbotApi";
import { ImageCropDialog } from "./ImageCropDialog";
import { CampaignCardPreview } from "./CampaignCardPreview";
import {
  ACTIONS,
  LAYOUTS,
  describeTargeting,
  type Campaign,
  type CampaignButton,
  type CampaignCondition,
  type CampaignContent,
  type CampaignTargeting,
} from "./campaignTemplates";

type Draft = Pick<Campaign, "name" | "type" | "content" | "targeting" | "startsAt" | "endsAt">;

const FIELD_OPTIONS: { value: CampaignCondition["field"]; label: string }[] = [
  { value: "current-page-url", label: "Page address" },
  { value: "referrer-url", label: "Came from (referrer)" },
  { value: "device-type", label: "Device" },
];
const OPERATOR_OPTIONS: { value: CampaignCondition["operator"]; label: string }[] = [
  { value: "contains", label: "contains" },
  { value: "equals", label: "is exactly" },
  { value: "starts-with", label: "starts with" },
  { value: "ends-with", label: "ends with" },
];

/** <input type="datetime-local"> wants local time without a zone. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export function ChatbotCampaignEditor({ id }: { id: string }) {
  const base = useModuleBase();
  const { has } = usePermissions();
  const canEdit = has("chatbot:write");
  const { state } = useChatbot();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "publish" | "pause" | null>(null);

  useEffect(() => {
    apiFetch<{ campaign: Campaign }>(`/chatbots/campaigns/${id}`)
      .then((r) => {
        setCampaign(r.campaign);
        setDraft(pickDraft(r.campaign));
      })
      .catch((err) => setError(errorText(err, "Could not load the campaign")));
  }, [id]);

  const accent = (state?.chatbot?.config.primaryColor as string) || "#1c1917";
  const dirty = useMemo(() => !!campaign && !!draft && JSON.stringify(pickDraft(campaign)) !== JSON.stringify(draft), [campaign, draft]);

  const setContent = (patch: Partial<CampaignContent>) => setDraft((d) => (d ? { ...d, content: { ...d.content, ...patch } } : d));
  const setTargeting = (patch: Partial<CampaignTargeting>) => setDraft((d) => (d ? { ...d, targeting: { ...d.targeting, ...patch } } : d));

  const save = async (status?: Campaign["status"]) => {
    if (!draft) return;
    setBusy(status === "active" ? "publish" : status === "paused" ? "pause" : "save");
    try {
      const res = await apiFetch<{ campaign: Campaign }>(`/chatbots/campaigns/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...draft, ...(status ? { status } : {}) }),
      });
      setCampaign(res.campaign);
      setDraft(pickDraft(res.campaign));
      toast.success(status === "active" ? "Campaign is live on your site" : status === "paused" ? "Campaign paused" : "Saved");
    } catch (err) {
      toast.error(errorText(err, "Could not save"));
    } finally {
      setBusy(null);
    }
  };

  if (error) {
    return (
      <PageShell title="Campaign">
        <Notice tone="danger">{error} <Link href={`${base}/campaigns`} className="font-medium underline">Back to campaigns</Link></Notice>
      </PageShell>
    );
  }

  const content = draft?.content;
  const layout = LAYOUTS.find((l) => l.value === content?.layout);
  const singleButton = !!content?.layout.endsWith("-button");
  const live = campaign?.status === "active";

  return (
    <PageShell
      flush
      title={draft?.name || "Campaign"}
      subtitle={
        <Link href={`${base}/campaigns`} className="inline-flex items-center gap-1 hover:text-foreground">
          <TbArrowLeft size={12} /> All campaigns
        </Link>
      }
      actions={
        canEdit &&
        campaign && (
          <>
            <Chip tone={live ? "green" : campaign.status === "paused" ? "amber" : "neutral"}>{live ? "Live" : campaign.status === "paused" ? "Paused" : "Draft"}</Chip>
            {live ? (
              <>
                <Button variant="outline" onClick={() => save("paused")} disabled={!!busy}>
                  {busy === "pause" ? <Spinner /> : <TbPlayerPause size={16} />} Pause
                </Button>
                <Button onClick={() => save()} disabled={!dirty || !!busy} data-testid="save-campaign">
                  {busy === "save" ? <Spinner /> : <TbDeviceFloppy size={16} />} {dirty ? "Update live campaign" : "Saved"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => save()} disabled={!dirty || !!busy} data-testid="save-campaign">
                  {busy === "save" ? <Spinner /> : <TbDeviceFloppy size={16} />} {dirty ? "Save draft" : "Saved"}
                </Button>
                <Button onClick={() => save("active")} disabled={!!busy} data-testid="publish-campaign">
                  {busy === "publish" ? <Spinner /> : <TbRocket size={16} />} Publish
                </Button>
              </>
            )}
          </>
        )
      }
    >
      {!draft && <div className="p-5"><LoadingRows rows={6} /></div>}
      {draft && content && (
        <div className="flex h-full min-h-0">
          <div className="min-w-0 flex-1 overflow-y-auto" data-testid="campaign-settings">
            <fieldset className="mx-auto flex max-w-3xl flex-col gap-5 p-5 sm:p-7" disabled={!canEdit}>
              <Panel title="Basics">
                <div className="grid gap-4">
                  <Field label="Campaign name" hint="Only your team sees this.">
                    <Input value={draft.name} maxLength={200} onChange={(e) => setDraft({ ...draft, name: e.target.value })} data-testid="campaign-name" />
                  </Field>
                  <Field label="How often" hint={draft.type === "one-time" ? "Each visitor sees it once, ever (remembered in their browser)." : "Shows every time a visitor matches the targeting."}>
                    <Segmented
                      value={draft.type}
                      onChange={(type) => setDraft({ ...draft, type })}
                      options={[
                        { value: "recurring", label: "Every time it matches" },
                        { value: "one-time", label: "Once per visitor" },
                      ]}
                    />
                  </Field>
                </div>
              </Panel>

              <Panel title="Design">
                <div className="grid gap-4">
                  <Field label="Layout">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {LAYOUTS.map((l) => (
                        <button
                          key={l.value}
                          type="button"
                          onClick={() => {
                            const single = l.value.endsWith("-button");
                            setContent({
                              layout: l.value,
                              hasImage: l.value.startsWith("image") && !!content.media?.src,
                              buttons: single ? content.buttons.slice(0, 1) : content.buttons,
                            });
                          }}
                          className={cn(
                            "rounded-xl border p-3 text-left transition-colors",
                            content.layout === l.value ? "border-foreground/50 bg-muted/60" : "border-border hover:bg-muted/30"
                          )}
                        >
                          <LayoutGlyph layout={l.value} />
                          <p className="mt-2 text-xs font-semibold">{l.label}</p>
                          <p className="text-[11px] leading-snug text-muted-foreground">{l.hint}</p>
                        </button>
                      ))}
                    </div>
                  </Field>
                  {content.layout.startsWith("image") && (
                    <CampaignImage
                      value={content.media?.src}
                      onChange={(src) => setContent({ media: src ? { src, alt: content.heading, type: "image" } : null, hasImage: !!src })}
                    />
                  )}
                  <Field label="Heading">
                    <Input value={content.heading} maxLength={120} placeholder="e.g. Questions? We reply in minutes." onChange={(e) => setContent({ heading: e.target.value })} data-testid="campaign-heading" />
                  </Field>
                  {content.layout.includes("subheading") && (
                    <Field label="Text">
                      <Textarea rows={3} value={content.subheading} maxLength={300} onChange={(e) => setContent({ subheading: e.target.value })} />
                    </Field>
                  )}
                </div>
              </Panel>

              <Panel title={singleButton ? "Button" : "Buttons"} description={singleButton ? "This layout has one button." : "Up to three. The first is usually the main action."}>
                <div className="flex flex-col gap-3">
                  {content.buttons.map((b, i) => (
                    <ButtonEditor
                      key={b.id}
                      button={b}
                      canMoveUp={i > 0}
                      canMoveDown={i < content.buttons.length - 1}
                      canRemove={content.buttons.length > 1}
                      onChange={(patch) => setContent({ buttons: content.buttons.map((x, j) => (j === i ? { ...x, ...patch } : x)) })}
                      onMove={(by) => {
                        const next = [...content.buttons];
                        const [item] = next.splice(i, 1);
                        next.splice(i + by, 0, item);
                        setContent({ buttons: next });
                      }}
                      onRemove={() => setContent({ buttons: content.buttons.filter((_, j) => j !== i) })}
                    />
                  ))}
                  {!singleButton && content.buttons.length < 3 && (
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setContent({ buttons: [...content.buttons, { id: `b${Date.now().toString(36)}`, text: "", style: "secondary", actionType: "open-chat", url: "" }] })}
                      >
                        <TbPlus size={14} /> Add button
                      </Button>
                    </div>
                  )}
                </div>
              </Panel>

              <Panel title="Who sees it, and when" description={describeTargeting(draft.targeting)}>
                <div className="grid gap-5">
                  <Field label="Visitors">
                    <Segmented
                      value={draft.targeting.visitorType}
                      onChange={(visitorType) => setTargeting({ visitorType })}
                      options={[
                        { value: "all", label: "Everyone" },
                        { value: "first-time", label: "First-time" },
                        { value: "returning", label: "Returning" },
                      ]}
                    />
                  </Field>
                  <Field label="Show it">
                    <div className="flex flex-col gap-3">
                      <Segmented
                        value={draft.targeting.trigger.type}
                        onChange={(type) => setTargeting({ trigger: { ...draft.targeting.trigger, type } })}
                        options={[
                          { value: "time-on-page", label: "After time on a page" },
                          { value: "exit-intent", label: "When they're about to leave" },
                        ]}
                      />
                      {draft.targeting.trigger.type === "time-on-page" ? (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">After</span>
                          <Input
                            type="number"
                            min={0}
                            className="w-20"
                            value={draft.targeting.trigger.value}
                            onChange={(e) => setTargeting({ trigger: { ...draft.targeting.trigger, value: Math.max(0, Number(e.target.value) || 0) } })}
                          />
                          <select
                            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                            value={draft.targeting.trigger.unit}
                            onChange={(e) => setTargeting({ trigger: { ...draft.targeting.trigger, unit: e.target.value as "seconds" | "minutes" } })}
                          >
                            <option value="seconds">seconds</option>
                            <option value="minutes">minutes</option>
                          </select>
                          <span className="text-muted-foreground">on a page</span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">On desktop: when the mouse heads for the tab bar. On phones: when they scroll most of the way down.</p>
                      )}
                    </div>
                  </Field>
                  <Field label="Only on some pages or devices" hint="Leave empty to show it everywhere.">
                    <div className="flex flex-col gap-2">
                      {draft.targeting.rules.conditions.length > 1 && (
                        <select
                          className="h-9 w-fit rounded-md border border-border bg-background px-2 text-sm"
                          value={draft.targeting.rules.matchType}
                          onChange={(e) => setTargeting({ rules: { ...draft.targeting.rules, matchType: e.target.value as "match-all" | "match-any" } })}
                        >
                          <option value="match-all">All of these must match</option>
                          <option value="match-any">Any one of these is enough</option>
                        </select>
                      )}
                      {draft.targeting.rules.conditions.map((c, i) => (
                        <ConditionRow
                          key={i}
                          condition={c}
                          onChange={(patch) =>
                            setTargeting({ rules: { ...draft.targeting.rules, conditions: draft.targeting.rules.conditions.map((x, j) => (j === i ? { ...x, ...patch } : x)) } })
                          }
                          onRemove={() => setTargeting({ rules: { ...draft.targeting.rules, conditions: draft.targeting.rules.conditions.filter((_, j) => j !== i) } })}
                        />
                      ))}
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setTargeting({ rules: { ...draft.targeting.rules, conditions: [...draft.targeting.rules.conditions, { field: "current-page-url", operator: "contains", value: "" }] } })
                          }
                        >
                          <TbPlus size={14} /> Add a rule
                        </Button>
                      </div>
                    </div>
                  </Field>
                </div>
              </Panel>

              <Panel title="Schedule" description="Optional. Outside these dates a live campaign doesn't show.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Starts">
                    <Input type="datetime-local" value={toLocalInput(draft.startsAt)} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                  </Field>
                  <Field label="Ends">
                    <Input type="datetime-local" value={toLocalInput(draft.endsAt)} onChange={(e) => setDraft({ ...draft, endsAt: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                  </Field>
                </div>
              </Panel>
            </fieldset>
          </div>

          <aside className="hidden w-[440px] shrink-0 flex-col border-l border-border/70 bg-muted/20 p-5 lg:flex" data-testid="campaign-preview">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview</p>
            <div className="flex flex-1 items-end justify-end rounded-2xl border border-border bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(127,127,127,0.05)_10px,rgba(127,127,127,0.05)_20px)] p-5">
              <CampaignCardPreview content={content} accent={accent} />
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">{layout?.label} · {describeTargeting(draft.targeting)}</p>
            {campaign && (
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Views" value={campaign.impressions} />
                <MiniStat label="Clicks" value={campaign.clicks} />
                <MiniStat label="Closed" value={campaign.closes} />
              </div>
            )}
          </aside>
        </div>
      )}
    </PageShell>
  );
}

function pickDraft(c: Campaign): Draft {
  return { name: c.name, type: c.type, content: c.content, targeting: c.targeting, startsAt: c.startsAt, endsAt: c.endsAt };
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

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background px-2 py-2">
      <p className="text-sm font-semibold tabular-nums">{value.toLocaleString()}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function LayoutGlyph({ layout }: { layout: CampaignContent["layout"] }) {
  const image = layout.startsWith("image");
  const text = layout.includes("subheading");
  const buttons = layout.endsWith("-button") ? 1 : 2;
  return (
    <div className="flex h-16 flex-col gap-1 overflow-hidden rounded-lg border border-border bg-background p-1.5">
      {image && <div className="h-5 rounded bg-muted-foreground/25" />}
      <div className="h-1.5 w-3/4 rounded bg-foreground/50" />
      {text && <div className="h-1 w-full rounded bg-muted-foreground/30" />}
      {Array.from({ length: buttons }).map((_, i) => (
        <div key={i} className={cn("h-2 rounded", i === 0 ? "bg-foreground/60" : "border border-foreground/40")} />
      ))}
    </div>
  );
}

function ButtonEditor({
  button,
  canMoveUp,
  canMoveDown,
  canRemove,
  onChange,
  onMove,
  onRemove,
}: {
  button: CampaignButton;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove: boolean;
  onChange: (patch: Partial<CampaignButton>) => void;
  onMove: (by: -1 | 1) => void;
  onRemove: () => void;
}) {
  const action = ACTIONS.find((a) => a.value === button.actionType) ?? ACTIONS[0];
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input className="min-w-[160px] flex-1" value={button.text} maxLength={40} placeholder="Button text" onChange={(e) => onChange({ text: e.target.value })} aria-label="Button text" />
        <select
          className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          value={button.style}
          onChange={(e) => onChange({ style: e.target.value as CampaignButton["style"] })}
          aria-label="Button style"
        >
          <option value="primary">Filled</option>
          <option value="secondary">Outline</option>
        </select>
        <div className="ml-auto flex items-center">
          <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={!canMoveUp} onClick={() => onMove(-1)}><TbArrowUp size={15} /></Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Move down" disabled={!canMoveDown} onClick={() => onMove(1)}><TbArrowDown size={15} /></Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Remove button" disabled={!canRemove} className="text-muted-foreground hover:text-red-600" onClick={onRemove}>
            <TbTrash size={15} />
          </Button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">When clicked</span>
        <select
          className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          value={button.actionType}
          onChange={(e) => onChange({ actionType: e.target.value as CampaignButton["actionType"], url: "" })}
          aria-label="Button action"
        >
          {ACTIONS.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
        {action.valueLabel && (
          <Input className="min-w-[200px] flex-1" value={button.url} placeholder={action.placeholder} onChange={(e) => onChange({ url: e.target.value })} aria-label={action.valueLabel} />
        )}
      </div>
    </div>
  );
}

function ConditionRow({ condition, onChange, onRemove }: { condition: CampaignCondition; onChange: (patch: Partial<CampaignCondition>) => void; onRemove: () => void }) {
  const isDevice = condition.field === "device-type";
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
      <select
        className="h-9 rounded-md border border-border bg-background px-2 text-sm"
        value={condition.field}
        onChange={(e) => {
          const field = e.target.value as CampaignCondition["field"];
          onChange(field === "device-type" ? { field, operator: "is", value: "mobile" } : { field, operator: "contains", value: "" });
        }}
        aria-label="Rule field"
      >
        {FIELD_OPTIONS.map((f) => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>
      {isDevice ? (
        <>
          <span className="text-sm text-muted-foreground">is</span>
          <select className="h-9 rounded-md border border-border bg-background px-2 text-sm" value={condition.value} onChange={(e) => onChange({ value: e.target.value })} aria-label="Device">
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
          </select>
        </>
      ) : (
        <>
          <select
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            value={condition.operator}
            onChange={(e) => onChange({ operator: e.target.value as CampaignCondition["operator"] })}
            aria-label="Rule operator"
          >
            {OPERATOR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Input
            className="min-w-[180px] flex-1"
            value={condition.value}
            placeholder={condition.field === "referrer-url" ? "e.g. linkedin.com" : "e.g. /pricing"}
            onChange={(e) => onChange({ value: e.target.value })}
            aria-label="Rule value"
          />
        </>
      )}
      <Button type="button" variant="ghost" size="icon" aria-label="Remove rule" className="ml-auto text-muted-foreground hover:text-red-600" onClick={onRemove}>
        <TbTrash size={15} />
      </Button>
    </div>
  );
}

function CampaignImage({ value, onChange }: { value?: string; onChange: (src: string | undefined) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ src: string; name: string } | null>(null);

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) return void toast.error("Choose an image file.");
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
    } catch (err) {
      toast.error(errorText(err, "Upload failed"));
    }
  };

  return (
    <Field label="Image" hint="Shown at the top of the card, 300 × 160. Landscape pictures work best.">
      <div className="flex items-center gap-3 rounded-xl border border-border p-3">
        <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <TbPhoto size={20} className="text-muted-foreground" />
          )}
        </div>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
          <TbUpload size={14} /> {value ? "Replace" : "Upload"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onChange(undefined)}>
            <TbTrash size={14} /> Remove
          </Button>
        )}
      </div>
      <ImageCropDialog src={pending?.src ?? null} fileName={pending?.name ?? "image.png"} aspect={300 / 160} title="Crop campaign image" onCancel={() => setPending(null)} onCropped={upload} />
    </Field>
  );
}
