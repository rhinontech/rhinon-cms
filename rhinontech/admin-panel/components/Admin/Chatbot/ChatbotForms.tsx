"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { TbArrowDown, TbArrowUp, TbDeviceFloppy, TbPlus, TbTrash } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { usePermissions } from "@/context/PermissionsContext";
import { useModuleBase } from "@/lib/sites";
import { LoadingRows, Notice, SettingsCard, SettingsFrame, Spinner } from "@/components/Admin/Settings/parts";
import { errorText, useChatbot, type ChatbotForms as Forms, type FormField } from "./chatbotApi";

/** Field types the widget renders, per form. */
const CONTACT_TYPES = [
  { value: "email", label: "Email" },
  { value: "name", label: "Name" },
  { value: "phone", label: "Phone" },
  { value: "text", label: "Short text" },
];
const TICKET_TYPES = [...CONTACT_TYPES, { value: "subject", label: "Subject" }, { value: "description", label: "Description" }];
const REVIEW_TYPES = [
  { value: "rating", label: "Star rating" },
  { value: "choice", label: "Pick one" },
  { value: "multiple-choice", label: "Pick several" },
  { value: "text", label: "Comment" },
];

const newId = (type: string) => `${type}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export function ChatbotForms() {
  const base = useModuleBase();
  const { has } = usePermissions();
  const canEdit = has("chatbot:write");
  const { state, error, save } = useChatbot();
  const [draft, setDraft] = useState<Forms | null>(null);
  const [saving, setSaving] = useState(false);

  const bot = state?.chatbot ?? null;
  useEffect(() => {
    if (bot && !draft) setDraft(bot.forms);
  }, [bot, draft]);
  const dirty = useMemo(() => !!bot && !!draft && JSON.stringify(bot.forms) !== JSON.stringify(draft), [bot, draft]);

  const submit = async () => {
    if (!draft) return;
    const ticketEmail = draft.ticket_form.some((f) => f.type === "email" && f.required);
    if (!ticketEmail) return void toast.error("The ticket form needs a required Email field, or replies can't reach the visitor.");
    const blank = [...draft.pre_chat_form, ...draft.ticket_form, ...(draft.post_chat_form.elements ?? [])].find((f) => !f.label.trim());
    if (blank) return void toast.error("Every field needs a label.");
    setSaving(true);
    try {
      const saved = await save({ forms: draft });
      setDraft(saved.forms);
      toast.success("Forms saved");
    } catch (err) {
      toast.error(errorText(err, "Could not save the forms"));
    } finally {
      setSaving(false);
    }
  };

  if (state && !bot) {
    return (
      <SettingsFrame title="Forms">
        <Notice tone="info">
          Create the chatbot first. <Link href={base} className="font-medium underline underline-offset-2">Go to Overview →</Link>
        </Notice>
      </SettingsFrame>
    );
  }

  return (
    <SettingsFrame
      title="Forms"
      description="What the bot asks visitors before a chat, after it, and when they raise a ticket."
      actions={
        canEdit && (
          <Button onClick={submit} disabled={!dirty || saving} data-testid="save-forms">
            {saving ? <Spinner /> : <TbDeviceFloppy size={16} />} Save
          </Button>
        )
      }
    >
      {error && <Notice tone="danger">{error}</Notice>}
      {!draft && !error && <LoadingRows rows={4} />}

      {draft && (
        <fieldset className="flex flex-col gap-4" disabled={!canEdit}>
          <SettingsCard
            title="Before the chat"
            description="Asked when a visitor starts talking to your team. Answers become a lead in the CRM. The AI also asks for name and email on its own after a few messages."
          >
            <FieldList fields={draft.pre_chat_form} types={CONTACT_TYPES} onChange={(pre_chat_form) => setDraft({ ...draft, pre_chat_form })} testId="pre-chat" />
          </SettingsCard>

          <SettingsCard
            title="After the chat"
            description="A short review when a live chat with your team closes. Answers show beside the chat in Live chats."
            actions={
              <Switch
                checked={draft.post_chat_form.enabled !== false}
                onCheckedChange={(enabled) => setDraft({ ...draft, post_chat_form: { ...draft.post_chat_form, enabled } })}
                data-testid="post-chat-enabled"
              />
            }
          >
            {draft.post_chat_form.enabled !== false && (
              <FieldList
                fields={draft.post_chat_form.elements ?? []}
                types={REVIEW_TYPES}
                onChange={(elements) => setDraft({ ...draft, post_chat_form: { ...draft.post_chat_form, elements } })}
                testId="post-chat"
              />
            )}
          </SettingsCard>

          <SettingsCard title="Raise a ticket" description="For questions that need a follow-up by email. Tickets appear in Live chats, marked as tickets.">
            <FieldList fields={draft.ticket_form} types={TICKET_TYPES} onChange={(ticket_form) => setDraft({ ...draft, ticket_form })} testId="ticket" />
          </SettingsCard>
        </fieldset>
      )}
    </SettingsFrame>
  );
}

function FieldList({
  fields,
  types,
  onChange,
  testId,
}: {
  fields: FormField[];
  types: { value: string; label: string }[];
  onChange: (fields: FormField[]) => void;
  testId: string;
}) {
  const update = (i: number, patch: Partial<FormField>) => onChange(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const move = (i: number, by: -1 | 1) => {
    const next = [...fields];
    const [item] = next.splice(i, 1);
    next.splice(i + by, 0, item);
    onChange(next);
  };
  const add = () => {
    const type = types[0].value;
    onChange([...fields, { id: newId(type), type, label: types[0].label, required: false, placeholder: "" }]);
  };
  const hasOptions = (t: string) => t === "choice" || t === "multiple-choice";

  return (
    <div className="flex flex-col gap-2" data-testid={`fields-${testId}`}>
      {fields.length === 0 && <p className="text-sm text-muted-foreground">No fields — this step is skipped.</p>}
      {fields.map((f, i) => (
        <div key={f.id} className="rounded-lg border border-border bg-card p-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              value={f.type}
              aria-label="Field type"
              onChange={(e) => update(i, { type: e.target.value, ...(hasOptions(e.target.value) && !f.options?.length ? { options: ["Yes", "No"] } : {}) })}
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <Input className="min-w-[160px] flex-1" value={f.label} aria-label="Label" placeholder="Label the visitor sees" onChange={(e) => update(i, { label: e.target.value })} />
            {!hasOptions(f.type) && f.type !== "rating" && (
              <Input className="min-w-[140px] flex-1" value={f.placeholder ?? ""} aria-label="Placeholder" placeholder="Placeholder (optional)" onChange={(e) => update(i, { placeholder: e.target.value })} />
            )}
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Switch checked={!!f.required} onCheckedChange={(required) => update(i, { required })} /> Required
            </label>
            <div className="ml-auto flex items-center">
              <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><TbArrowUp size={15} /></Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Move down" disabled={i === fields.length - 1} onClick={() => move(i, 1)}><TbArrowDown size={15} /></Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Remove field" className="text-muted-foreground hover:text-red-600" onClick={() => onChange(fields.filter((_, j) => j !== i))}>
                <TbTrash size={15} />
              </Button>
            </div>
          </div>
          {hasOptions(f.type) && (
            <Input
              className="mt-2"
              aria-label="Options"
              value={(f.options ?? []).join(", ")}
              placeholder="Options, separated by commas"
              onChange={(e) => update(i, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
            />
          )}
        </div>
      ))}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={add} data-testid={`add-field-${testId}`}>
          <TbPlus size={15} /> Add field
        </Button>
      </div>
    </div>
  );
}
