import { View, Text, Span, Pressable, TextInput } from "@/components/rn";
import { Mail, MessageCircle, NotebookPen, Phone, Plus } from "@/components/icons";
import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Chip,
  Display,
  Eyebrow,
  Field,
  NoAccess,
  ProgressBar,
  Screen,
  SectionLabel,
  Segmented,
  Sheet,
  TopBar,
  inputClass,
  stagger,
} from "@/components/rhinon/ui";
import { BarRow } from "@/components/rhinon/charts";
import { lakh } from "@/lib/format";
import { STAGES, nameOf, type Deal } from "@/lib/mock-data";
import { LIFECYCLES, type Account, type ActivityKind, type CrmLead } from "@/lib/mock-more";
import { actions, useApp, usePerm } from "@/lib/store";
import { TONES, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";
type Tab = "pipeline" | "leads" | "accounts" | "reports";
type Target = {
  kind: "deal" | "lead" | "account";
  id: string;
} | null;
const LEAD_TONE: Record<string, Tone> = {
  New: "sky",
  Contacted: "sun",
  Interested: "leaf",
  Replied: "coral",
};
const KIND_LABEL: Record<ActivityKind, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  note: "Note",
};
export default function CrmPage() {
  const deals = useApp((s) => s.deals);
  const leads = useApp((s) => s.leads);
  const accounts = useApp((s) => s.accounts);
  const allowed = usePerm("crm");
  const [tab, setTab] = useState<Tab>("pipeline");
  const [open, setOpen] = useState<Target>(null);
  const [logging, setLogging] = useState<string | null>(null);
  if (!allowed) {
    return (
      <Screen>
        <TopBar title="CRM" fallback="/more" />
        <NoAccess
          title="No CRM access"
          body="CRM is limited to admins in this workspace. Ask an admin to grant crm:read."
        />
      </Screen>
    );
  }
  const openValue = deals.filter((d) => d.stage !== "won").reduce((s, d) => s + d.value, 0);
  const won = deals.filter((d) => d.stage === "won");
  const deal = open?.kind === "deal" ? deals.find((d) => d.id === open.id) : undefined;
  const lead = open?.kind === "lead" ? leads.find((l) => l.id === open.id) : undefined;
  const account = open?.kind === "account" ? accounts.find((a) => a.id === open.id) : undefined;
  return (
    <Screen>
      <TopBar title="CRM" fallback="/more" />
      <View className="animate-rise">
        <Eyebrow tone="rose">Rhinon Tech · pipeline</Eyebrow>
        <Display size="hero" className="mt-3">
          Close
          {"\n"}
          the loop.
        </Display>
      </View>

      <View
        className="mt-6 animate-rise rounded-[calc(var(--radius)+14px)] bg-rose p-5 text-rose-foreground"
        style={stagger(1)}
      >
        <Text className="font-mono text-[11px] font-medium uppercase tracking-[0.18em]">
          Open pipeline
        </Text>
        <Text className="mt-3 font-display text-[length:calc(78px*var(--ds))] leading-[0.8]">
          {lakh(openValue)}
        </Text>
        <Text className="mt-3 text-[14px]">
          {deals.filter((d) => d.stage !== "won").length} open deals · {won.length} won ·{" "}
          {lakh(won.reduce((s, d) => s + d.value, 0))} closed
        </Text>
      </View>

      <Segmented
        className="mt-6"
        value={tab}
        onChange={setTab}
        options={[
          {
            value: "pipeline",
            label: "Deals",
          },
          {
            value: "leads",
            label: "Leads",
          },
          {
            value: "accounts",
            label: "Cos.",
          },
          {
            value: "reports",
            label: "Stats",
          },
        ]}
      />

      {tab === "pipeline" ? (
        <View className="no-scrollbar -mx-5 mt-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-2">
          {STAGES.map((st) => {
            const col = deals.filter((d) => d.stage === st.id);
            return (
              <View key={st.id} className="w-[272px] shrink-0 snap-start">
                <View className="mb-3 flex items-center justify-between">
                  <View
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-full px-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em]",
                      TONES[st.tone].solid,
                    )}
                  >
                    {st.name}
                    <Span className="opacity-70">{col.length}</Span>
                  </View>
                  <Span className="font-mono text-[11px] text-ink/50">
                    {lakh(col.reduce((s, d) => s + d.value, 0))}
                  </Span>
                </View>
                <View className="space-y-2.5">
                  {col.length === 0 ? (
                    <View className="rounded-2xl border-2 border-dashed border-ink/15 px-4 py-8 text-center text-[13px] text-ink/40">
                      Nothing here yet
                    </View>
                  ) : null}
                  {col.map((d) => (
                    <View key={d.id}>
                      <Pressable
                        onPress={() =>
                          setOpen({
                            kind: "deal",
                            id: d.id,
                          })
                        }
                        className="press w-full rounded-2xl border border-line/70 bg-card p-3.5 text-left"
                      >
                        <Text className="truncate text-[15px] font-semibold leading-tight">
                          {d.company}
                        </Text>
                        <Text className="mt-0.5 truncate text-[13px] text-ink/55">{d.title}</Text>
                        <Text className="mt-3 font-display text-[length:calc(36px*var(--ds))] leading-none">
                          {lakh(d.value)}
                        </Text>
                        <View className="mt-3 flex items-center justify-between">
                          <Avatar name={nameOf(d.owner)} size={24} />
                          <Span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/45">
                            {d.stage === "won" ? d.close : `Close ${d.close}`}
                          </Span>
                        </View>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {tab === "leads" ? (
        <View className="mt-4">
          {leads.map((l, i) => (
            <View
              key={l.id}
              className="animate-rise border-b border-line/70 last:border-0"
              style={stagger(Math.min(i, 6))}
            >
              <Pressable
                onPress={() =>
                  setOpen({
                    kind: "lead",
                    id: l.id,
                  })
                }
                className="press flex w-full items-center gap-3.5 py-3.5 text-left"
              >
                <Avatar name={l.name} size={48} />
                <View className="min-w-0 flex-1">
                  <View className="block truncate text-[16px] font-semibold leading-tight">
                    {l.name}
                  </View>
                  <View className="block truncate text-[13.5px] text-ink/55">
                    {l.title} · {l.company}
                  </View>
                  <View className="mt-0.5 block font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/40">
                    {l.lifecycle} · {l.last}
                  </View>
                </View>
                <Badge tone={LEAD_TONE[l.status] ?? "ink"}>{l.status}</Badge>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {tab === "accounts" ? (
        <View className="mt-4 space-y-2.5">
          {accounts.map((a, i) => {
            const ds = deals.filter((d) => d.company === a.name);
            return (
              <View key={a.id} className="animate-rise" style={stagger(Math.min(i, 6))}>
                <Pressable
                  onPress={() =>
                    setOpen({
                      kind: "account",
                      id: a.id,
                    })
                  }
                  className="press flex w-full items-center gap-4 rounded-2xl border border-line/70 bg-card p-3.5 text-left"
                >
                  <View className="grid size-12 shrink-0 place-items-center rounded-2xl bg-rose font-display text-[length:calc(26px*var(--ds))] leading-none text-rose-foreground">
                    {a.name[0]}
                  </View>
                  <View className="min-w-0 flex-1">
                    <View className="block truncate text-[16px] font-semibold leading-tight">
                      {a.name}
                    </View>
                    <View className="block truncate text-[13px] text-ink/55">
                      {a.industry} · {a.city}
                    </View>
                  </View>
                  <View className="text-right">
                    <View className="block font-display text-[length:calc(24px*var(--ds))] leading-none">
                      {lakh(ds.reduce((s, d) => s + d.value, 0))}
                    </View>
                    <Span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45">
                      {ds.length} deals
                    </Span>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : null}

      {tab === "reports" ? <Reports /> : null}

      <Sheet open={deal !== undefined} onClose={() => setOpen(null)}>
        {deal ? <DealDetail deal={deal} onLog={() => setLogging(deal.id)} /> : null}
      </Sheet>
      <Sheet open={lead !== undefined} onClose={() => setOpen(null)}>
        {lead ? <LeadDetail lead={lead} onLog={() => setLogging(lead.id)} /> : null}
      </Sheet>
      <Sheet open={account !== undefined} onClose={() => setOpen(null)}>
        {account ? <AccountDetail account={account} /> : null}
      </Sheet>
      <LogSheet target={logging} onClose={() => setLogging(null)} />
    </Screen>
  );
}
function Reports() {
  const deals = useApp((s) => s.deals);
  const total = deals.length;
  const won = deals.filter((d) => d.stage === "won");
  const open = deals.filter((d) => d.stage !== "won");
  const avg = total ? deals.reduce((s, d) => s + d.value, 0) / total : 0;
  const max = Math.max(
    ...STAGES.map((st) => deals.filter((d) => d.stage === st.id).reduce((s, d) => s + d.value, 0)),
    1,
  );
  return (
    <View className="mt-5 space-y-3">
      <View className="grid grid-cols-2 gap-2.5">
        {[
          ["Win rate", `${total ? Math.round((won.length / total) * 100) : 0}%`, "bg-leaf/15"],
          ["Avg deal", lakh(avg), "bg-sun/35"],
          ["Open deals", String(open.length), "bg-cobalt/12"],
          [
            "Closing soon",
            String(open.filter((d) => d.close.includes("Nov") || d.close.includes("Dec")).length),
            "bg-rose/25",
          ],
        ].map(([label, value, bg]) => (
          <View key={label} className={cn("rounded-2xl p-4", bg)}>
            <Text className="font-display text-[length:calc(38px*var(--ds))] leading-none">
              {value}
            </Text>
            <Text className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">
              {label}
            </Text>
          </View>
        ))}
      </View>
      <View className="rounded-3xl border border-line/70 bg-card p-5">
        <SectionLabel className="mb-4">Value by stage</SectionLabel>
        <View className="space-y-4">
          {STAGES.map((st) => {
            const value = deals.filter((d) => d.stage === st.id).reduce((s, d) => s + d.value, 0);
            return (
              <BarRow
                key={st.id}
                label={st.name}
                value={lakh(value)}
                pct={(value / max) * 100}
                tone={st.tone}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}
function Timeline({ on }: { on: string }) {
  const items = useApp((s) => s.activities).filter((a) => a.on === on);
  if (items.length === 0) {
    return (
      <Text className="rounded-2xl bg-paper-deep px-4 py-4 text-center text-[13.5px] text-ink/55">
        No activity yet.
      </Text>
    );
  }
  return (
    <View className="space-y-3">
      {items.map((a) => (
        <View key={a.id} className="flex gap-3">
          <View className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-rose/25 font-mono text-[10px] uppercase">
            {a.kind[0]}
          </View>
          <View className="min-w-0">
            <Text className="text-[14.5px] leading-snug">{a.text}</Text>
            <Text className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45">
              {KIND_LABEL[a.kind]} · {nameOf(a.by).split(" ")[0]} · {a.at}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
function Actions({ onLog, name }: { onLog: () => void; name: string }) {
  return (
    <View className="mt-4 grid grid-cols-4 gap-2">
      {(
        [
          [Phone, "Call", () => actions.toast(`Calling ${name}…`, "rose")],
          [Mail, "Email", () => actions.toast(`Draft to ${name}`, "rose")],
          [MessageCircle, "WhatsApp", () => actions.toast(`Opening WhatsApp`, "rose")],
          [NotebookPen, "Log", onLog],
        ] as const
      ).map(([Icon, label, fn]) => (
        <Pressable
          key={label}
          onPress={fn}
          className="press flex h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-line/70 bg-card"
        >
          <Icon size={20} />
          <Span className="font-mono text-[9.5px] uppercase tracking-[0.1em]">{label}</Span>
        </Pressable>
      ))}
    </View>
  );
}
function DealDetail({ deal, onLog }: { deal: Deal; onLog: () => void }) {
  const stage = STAGES.find((s) => s.id === deal.stage);
  return (
    <View>
      <Eyebrow tone="rose">{deal.company}</Eyebrow>
      <Display as="h2" size="lg" className="mt-1.5">
        {deal.title}
      </Display>
      <Text className="mt-3 font-display text-[length:calc(72px*var(--ds))] leading-[0.82]">
        {lakh(deal.value)}
      </Text>
      {stage ? (
        <View className="mt-3">
          <Badge tone={stage.tone}>{stage.name}</Badge>
        </View>
      ) : null}

      <Text className="mb-2 mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ink/50">
        Move to stage
      </Text>
      <View className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {STAGES.map((s) => (
          <Chip
            key={s.id}
            tone={s.tone}
            active={deal.stage === s.id}
            onClick={() => actions.moveDeal(deal.id, s.id)}
          >
            {s.name}
          </Chip>
        ))}
      </View>

      <View className="mt-5 rounded-3xl border border-line/70 bg-card p-4">
        <Text className="font-semibold">{deal.contact}</Text>
        <Text className="text-[13.5px] text-ink/55">
          Owner {nameOf(deal.owner)} · close {deal.close}
        </Text>
        <Text className="mt-3 text-[14.5px] leading-relaxed text-ink/75">{deal.note}</Text>
      </View>
      <Actions onLog={onLog} name={deal.contact.split(" ")[0] ?? ""} />

      <SectionLabel className="mb-3 mt-7">Timeline</SectionLabel>
      <Timeline on={deal.id} />
    </View>
  );
}
function LeadDetail({ lead, onLog }: { lead: CrmLead; onLog: () => void }) {
  return (
    <View>
      <View className="flex items-center gap-4">
        <Avatar name={lead.name} size={60} />
        <View className="min-w-0">
          <Display as="h2" size="md">
            {lead.name}
          </Display>
          <Text className="truncate text-[14px] text-ink/60">
            {lead.title} · {lead.company}
          </Text>
        </View>
      </View>
      <View className="mt-3 flex flex-wrap gap-2">
        <Badge tone={LEAD_TONE[lead.status] ?? "ink"}>{lead.status}</Badge>
        <Badge tone="ink" dot={false}>
          {lead.source}
        </Badge>
      </View>

      <Text className="mb-2 mt-5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ink/50">
        Lifecycle
      </Text>
      <View className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {LIFECYCLES.map((l) => (
          <Chip
            key={l}
            tone="rose"
            active={lead.lifecycle === l}
            onClick={() => actions.setLifecycle(lead.id, l)}
          >
            {l}
          </Chip>
        ))}
      </View>

      <View className="mt-4 divide-y divide-line/70 rounded-3xl border border-line/70 bg-card px-4">
        {[
          ["Email", lead.email],
          ["Phone", lead.phone],
          ["Owner", nameOf(lead.owner)],
        ].map(([k, v]) => (
          <View key={k} className="flex items-center justify-between gap-4 py-3">
            <View className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink/50">
              {k}
            </View>
            <View className="truncate text-[14.5px] font-medium">{v}</View>
          </View>
        ))}
      </View>
      <Actions onLog={onLog} name={lead.name.split(" ")[0] ?? ""} />
      <Button
        tone="ink"
        size="md"
        className="mt-3"
        icon={Plus}
        onClick={() => actions.convertLead(lead.id)}
      >
        Convert to a deal
      </Button>

      <SectionLabel className="mb-3 mt-7">Timeline</SectionLabel>
      <Timeline on={lead.id} />
    </View>
  );
}
function AccountDetail({ account }: { account: Account }) {
  const deals = useApp((s) => s.deals).filter((d) => d.company === account.name);
  const people = useApp((s) => s.leads).filter((l) => l.company === account.name);
  return (
    <View>
      <Eyebrow tone="rose">
        {account.industry} · {account.city}
      </Eyebrow>
      <Display as="h2" size="lg" className="mt-1.5">
        {account.name}
      </Display>
      <Text className="mt-3 text-[14.5px] leading-relaxed text-ink/70">{account.note}</Text>
      <View className="mt-4 grid grid-cols-2 gap-2.5">
        <View className="rounded-2xl border border-line/70 bg-card p-3.5">
          <Text className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">
            Size
          </Text>
          <Text className="mt-1 font-semibold">{account.size}</Text>
        </View>
        <View className="rounded-2xl border border-line/70 bg-card p-3.5">
          <Text className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">
            Customer since
          </Text>
          <Text className="mt-1 font-semibold">{account.since}</Text>
        </View>
      </View>

      <SectionLabel className="mb-3 mt-6">Contacts</SectionLabel>
      <View className="space-y-2">
        {people.length === 0 ? (
          <View className="text-[13.5px] text-ink/50">No contacts yet.</View>
        ) : null}
        {people.map((p) => (
          <View key={p.id} className="flex items-center gap-3">
            <Avatar name={p.name} size={36} />
            <View className="min-w-0">
              <View className="block truncate font-semibold leading-tight">{p.name}</View>
              <View className="block truncate text-[13px] text-ink/55">{p.title}</View>
            </View>
          </View>
        ))}
      </View>

      <SectionLabel className="mb-3 mt-6">Deals</SectionLabel>
      <View className="space-y-2">
        {deals.length === 0 ? (
          <View className="text-[13.5px] text-ink/50">No deals yet.</View>
        ) : null}
        {deals.map((d) => (
          <View
            key={d.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-line/70 bg-card p-3.5"
          >
            <View className="min-w-0 truncate font-semibold">{d.title}</View>
            <View className="shrink-0 font-display text-[length:calc(24px*var(--ds))] leading-none">
              {lakh(d.value)}
            </View>
          </View>
        ))}
      </View>
      <ProgressBar value={Math.min(1, deals.length / 3)} tone="rose" className="mt-5" />
    </View>
  );
}
function LogSheet({ target, onClose }: { target: string | null; onClose: () => void }) {
  const [kind, setKind] = useState<ActivityKind>("call");
  const [text, setText] = useState("");
  const save = () => {
    if (!target || !text.trim()) return;
    actions.logActivity(target, kind, text.trim());
    setText("");
    onClose();
  };
  return (
    <Sheet open={target !== null} onClose={onClose} eyebrow="Timeline" title="Log an activity">
      <View className="space-y-5">
        <Field label="What happened">
          <View className="flex flex-wrap gap-2">
            {(Object.keys(KIND_LABEL) as ActivityKind[]).map((k) => (
              <Chip key={k} tone="rose" active={kind === k} onClick={() => setKind(k)}>
                {KIND_LABEL[k]}
              </Chip>
            ))}
          </View>
        </Field>
        <Field label="Notes">
          <TextInput
            className={cn(inputClass, "min-h-28 resize-none")}
            value={text}
            onChangeText={(text) => setText(text)}
            placeholder="What was said, and what happens next?"
            multiline
          />
        </Field>
        <Button tone="ink" disabled={!text.trim()} onClick={save}>
          Save to timeline
        </Button>
      </View>
    </Sheet>
  );
}
