import { View, Text, Span, Pressable, TextInput } from "@/components/rn";
import { Check, Pause, Pencil, Play, X } from "@/components/icons";
import { useState } from "react";
import { BrandChip, BrandPickSheet } from "@/components/rhinon/brand";
import {
  Avatar,
  Badge,
  Button,
  Display,
  Empty,
  Eyebrow,
  NoAccess,
  ProgressBar,
  Screen,
  SectionLabel,
  Segmented,
  Toggle,
  TopBar,
  inputClass,
  stagger,
} from "@/components/rhinon/ui";
import { SENT, type OutreachDraft } from "@/lib/mock-more";
import { actions, useApp, usePerm } from "@/lib/store";
import { TONES, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";
type Tab = "review" | "campaigns" | "flows";
const STATUS_TONE: Record<string, Tone> = {
  Active: "leaf",
  Paused: "sun",
  Draft: "ink",
  Completed: "cobalt",
};
const SENT_TONE: Record<string, Tone> = {
  Sent: "ink",
  Opened: "sky",
  Replied: "leaf",
  Bounced: "coral",
};

/** An AI-written email that has NOT been sent. Dashed outline and a "not sent" tag keep it apart from sent mail. */
function DraftCard({ d, index }: { d: OutreachDraft; index: number }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(d.body);
  const [leaving, setLeaving] = useState<"approved" | "rejected" | null>(null);
  const decide = (decision: "approved" | "rejected") => {
    if (editing) actions.editDraft(d.id, body);
    setLeaving(decision);
    window.setTimeout(() => actions.decideDraft(d.id, decision), 260);
  };
  return (
    <View
      className={cn(
        "animate-rise rounded-3xl border-2 border-dashed border-ink/25 bg-paper-deep p-4 transition-all duration-300",
        leaving && "scale-95 opacity-0",
      )}
      style={stagger(Math.min(index, 5))}
    >
      <View className="flex items-center gap-3">
        <Avatar name={d.lead} size={42} />
        <View className="min-w-0 flex-1">
          <Text className="truncate font-semibold leading-tight">{d.lead}</Text>
          <Text className="truncate text-[13px] text-ink/55">
            {d.title} · {d.company}
          </Text>
        </View>
      </View>
      <View className="mt-3 flex items-center justify-between gap-2">
        <Text className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink/50">
          {d.stage}
        </Text>
        <Badge tone="sun">AI draft · not sent</Badge>
      </View>
      <Display as="h3" size="md" className="mt-1.5">
        {d.subject}
      </Display>
      {editing ? (
        <TextInput
          className={cn(inputClass, "mt-3 min-h-36 resize-none text-[14.5px]")}
          value={body}
          onChangeText={(text) => setBody(text)}
          accessibilityLabel="Edit the draft"
          multiline
        />
      ) : (
        <Text className="mt-2.5 text-[15px] leading-relaxed text-ink/80">{body}</Text>
      )}
      <View className="mt-4 grid grid-cols-[auto_auto_1fr] gap-2">
        <Pressable
          accessibilityLabel="Reject draft"
          onPress={() => decide("rejected")}
          className="press grid size-12 place-items-center rounded-full border border-ink/20 bg-card"
        >
          <X size={20} />
        </Pressable>
        <Pressable
          accessibilityLabel={editing ? "Done editing" : "Edit draft"}
          onPress={() => setEditing((e) => !e)}
          className={cn(
            "press grid size-12 place-items-center rounded-full border border-ink/20",
            editing ? "bg-ink text-paper" : "bg-card",
          )}
        >
          <Pencil size={18} />
        </Pressable>
        <Button tone="leaf" size="md" icon={Check} onClick={() => decide("approved")}>
          Approve
        </Button>
      </View>
    </View>
  );
}
export default function OutreachPage() {
  const brand = useApp((s) => s.brand);
  const drafts = useApp((s) => s.drafts);
  const campaigns = useApp((s) => s.campaigns);
  const flows = useApp((s) => s.flows);
  const allowed = usePerm("outreach");
  const [tab, setTab] = useState<Tab>("review");
  const [picking, setPicking] = useState(false);
  if (!allowed) {
    return (
      <Screen>
        <TopBar title="Outreach" fallback="/more" />
        <NoAccess
          title="No Outreach access"
          body="Outreach is limited to admins. Ask an admin to grant outreach:read."
        />
      </Screen>
    );
  }
  const pending = drafts.filter((d) => d.brand === brand && d.status === "pending");
  const queued = drafts.filter((d) => d.brand === brand && d.status === "approved");
  const mine = campaigns.filter((c) => c.brand === brand);
  const myFlows = flows.filter((f) => f.brand === brand);
  const sent = SENT.filter((x) => x.brand === brand);
  return (
    <Screen>
      <TopBar
        title="Outreach"
        fallback="/more"
        right={<BrandChip onClick={() => setPicking(true)} />}
      />
      <View className="animate-rise">
        <Eyebrow tone="coral">{pending.length} drafts waiting</Eyebrow>
        <Display size="hero" className="mt-3">
          Review,
          {"\n"}
          then send.
        </Display>
      </View>

      <Segmented
        className="mt-6"
        value={tab}
        onChange={setTab}
        options={[
          {
            value: "review",
            label: "Review",
            badge: pending.length || undefined,
          },
          {
            value: "campaigns",
            label: "Campaigns",
          },
          {
            value: "flows",
            label: "Flows",
          },
        ]}
      />

      {tab === "review" ? (
        <View className="mt-5">
          {pending.length === 0 ? (
            <Empty
              tone="coral"
              title="Nothing to review"
              body="New AI drafts appear here before anything is sent."
            />
          ) : (
            <View className="space-y-3">
              {pending.map((d, i) => (
                <DraftCard key={d.id} d={d} index={i} />
              ))}
            </View>
          )}

          <SectionLabel className="mb-3 mt-9">Queued and sent</SectionLabel>
          <View className="space-y-2.5">
            {queued.map((d) => (
              <View
                key={d.id}
                className="flex items-center gap-3 rounded-2xl border border-dashed border-ink/25 p-3.5"
              >
                <Avatar name={d.lead} size={40} />
                <View className="min-w-0 flex-1">
                  <Text className="truncate font-semibold leading-tight">{d.lead}</Text>
                  <Text className="truncate text-[13px] text-ink/55">{d.subject}</Text>
                </View>
                <Badge tone="sun">Queued</Badge>
              </View>
            ))}
            {sent.map((s) => (
              <View
                key={s.id}
                className="flex items-center gap-3 rounded-2xl border border-line/70 bg-card p-3.5"
              >
                <Avatar name={s.lead} size={40} />
                <View className="min-w-0 flex-1">
                  <Text className="truncate font-semibold leading-tight">{s.lead}</Text>
                  <Text className="truncate text-[13px] text-ink/55">{s.subject}</Text>
                </View>
                <View className="text-right">
                  <Badge tone={SENT_TONE[s.status] ?? "ink"}>{s.status}</Badge>
                  <Text className="mt-1 font-mono text-[10px] text-ink/40">{s.at}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {tab === "campaigns" ? (
        <View className="mt-5 space-y-3">
          {mine.length === 0 ? (
            <Empty
              tone="coral"
              title="No campaigns"
              body="Create one on the web, then run it from here."
            />
          ) : null}
          {mine.map((c, i) => (
            <View
              key={c.id}
              className="animate-rise rounded-3xl border border-line/70 bg-card p-4"
              style={stagger(Math.min(i, 5))}
            >
              <View className="flex items-start justify-between gap-3">
                <View className="min-w-0">
                  <Text className="text-[17px] font-semibold leading-snug">{c.name}</Text>
                  <Text className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/50">
                    {c.channel} · daily at {c.runTime}
                  </Text>
                </View>
                <Badge tone={STATUS_TONE[c.status] ?? "ink"}>{c.status}</Badge>
              </View>
              <View className="mt-4 grid grid-cols-4 gap-2 text-center">
                {(
                  [
                    ["Sent", c.sent],
                    ["Opened", c.channel === "Email" ? c.opened : "—"],
                    ["Replied", c.replied],
                    ["Bounced", c.bounced],
                  ] as const
                ).map(([label, value]) => (
                  <View key={label} className="rounded-xl bg-paper-deep py-2.5">
                    <Text className="font-display text-[length:calc(26px*var(--ds))] leading-none">
                      {value}
                    </Text>
                    <Text className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink/50">
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
              <ProgressBar value={c.leads ? c.sent / c.leads : 0} tone="coral" className="mt-4" />
              <View className="mt-2.5 flex items-center justify-between">
                <Span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/50">
                  {c.sent} of {c.leads} leads
                </Span>
                {c.status !== "Completed" ? (
                  <Pressable
                    onPress={() => actions.toggleCampaign(c.id)}
                    className={cn(
                      "press inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold",
                      c.status === "Active" ? "border border-ink/20" : TONES.ink.solid,
                    )}
                  >
                    {c.status === "Active" ? <Pause size={14} /> : <Play size={14} />}
                    {c.status === "Active" ? "Pause" : "Start"}
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {tab === "flows" ? (
        <View className="mt-5 space-y-2.5">
          {myFlows.length === 0 ? (
            <Empty
              tone="coral"
              title="No flows"
              body="Build flows on the web. They appear here read-only."
            />
          ) : null}
          {myFlows.map((f, i) => (
            <View
              key={f.id}
              className="flex animate-rise items-center gap-4 rounded-2xl border border-line/70 bg-card p-4"
              style={stagger(i)}
            >
              <View className="min-w-0 flex-1">
                <Text className="text-[16px] font-semibold leading-tight">{f.name}</Text>
                <Text className="mt-0.5 text-[13px] text-ink/55">{f.trigger}</Text>
                <Text className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/45">
                  {f.enrolled} enrolled · {f.steps} steps
                </Text>
              </View>
              <Toggle
                on={f.active}
                onChange={() => actions.toggleFlow(f.id)}
                label={`${f.name} active`}
              />
            </View>
          ))}
          <View className="pt-2 text-center text-[13px] text-ink/50">
            Editing a flow stays on the web.
          </View>
        </View>
      ) : null}

      <BrandPickSheet open={picking} onClose={() => setPicking(false)} />
    </Screen>
  );
}
