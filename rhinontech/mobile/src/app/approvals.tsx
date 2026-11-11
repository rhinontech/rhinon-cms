import { View, Text, TextInput } from "@/components/rn";
import { Check } from "@/components/icons";
import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Chip,
  Display,
  Empty,
  Eyebrow,
  Field,
  NoAccess,
  Screen,
  Sheet,
  TopBar,
  inputClass,
  stagger,
} from "@/components/rhinon/ui";
import { rupee } from "@/lib/format";
import { nameOf, type Approval } from "@/lib/mock-data";
import { actions, useApp, usePerm } from "@/lib/store";
import type { Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";
type Filter = "all" | Approval["kind"];
const KIND: Record<
  Approval["kind"],
  {
    label: string;
    tone: Tone;
  }
> = {
  leave: {
    label: "Leave",
    tone: "sky",
  },
  attendance: {
    label: "Correction",
    tone: "leaf",
  },
  reimbursement: {
    label: "Claim",
    tone: "sun",
  },
};
export default function ApprovalsPage() {
  const approvals = useApp((s) => s.approvals);
  const allowed = usePerm("approvals");
  const [filter, setFilter] = useState<Filter>("all");
  const [leaving, setLeaving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Approval | null>(null);
  const [note, setNote] = useState("");
  if (!allowed) {
    return (
      <Screen>
        <TopBar title="Approvals" fallback="/more" />
        <NoAccess
          title="Managers only"
          body="Approvals are for managers, HR and admins. Ask your admin if you need access."
        />
      </Screen>
    );
  }
  const count = (k: Filter) =>
    k === "all" ? approvals.length : approvals.filter((a) => a.kind === k).length;
  const rows = approvals.filter((a) => filter === "all" || a.kind === filter);
  const decide = (a: Approval, d: "approved" | "rejected") => {
    setLeaving(a.id);
    window.setTimeout(() => {
      actions.decide(a.id, d);
      setLeaving(null);
    }, 280);
  };
  return (
    <Screen>
      <TopBar title="Approvals" fallback="/more" />
      <View className="animate-rise">
        <Eyebrow tone="violet">{approvals.length} waiting on you</Eyebrow>
        <Display size="hero" className="mt-3">
          Your
          {"\n"}
          call.
        </Display>
      </View>

      <View className="no-scrollbar -mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1">
        {(
          [
            ["all", "All"],
            ["leave", "Leave"],
            ["attendance", "Corrections"],
            ["reimbursement", "Claims"],
          ] as [Filter, string][]
        ).map(([v, l]) => (
          <Chip
            key={v}
            tone="violet"
            active={filter === v}
            onClick={() => setFilter(v)}
            count={count(v) || undefined}
          >
            {l}
          </Chip>
        ))}
      </View>

      {rows.length === 0 ? (
        <Empty
          tone="violet"
          title="All caught up"
          body="Nothing is waiting on you. New requests from your team will show up here."
        />
      ) : (
        <View className="mt-5 space-y-3">
          {rows.map((a, i) => (
            <View
              key={a.id}
              className={cn(
                "animate-rise rounded-3xl border border-line/70 bg-card p-4 transition-all duration-300",
                leaving === a.id && "scale-95 opacity-0",
              )}
              style={stagger(Math.min(i, 5))}
            >
              <View className="flex items-center gap-3">
                <Avatar name={nameOf(a.who)} size={44} />
                <View className="min-w-0 flex-1">
                  <Text className="truncate font-semibold leading-tight">{nameOf(a.who)}</Text>
                  <Text className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">
                    {a.when}
                  </Text>
                </View>
                <Badge tone={KIND[a.kind].tone}>{KIND[a.kind].label}</Badge>
              </View>

              <Display as="h3" size="md" className="mt-4">
                {a.title}
              </Display>
              {a.amount ? (
                <Text className="mt-1.5 font-display text-[length:calc(48px*var(--ds))] font-black leading-[0.9]">
                  {rupee(a.amount)}
                </Text>
              ) : null}
              <Text className="mt-1.5 text-[14.5px] text-ink/60">{a.detail}</Text>
              {a.note ? (
                <Text className="mt-3 rounded-xl bg-paper-deep px-3 py-2 text-[13.5px] italic text-ink/70">
                  “{a.note}”
                </Text>
              ) : null}

              <View className="mt-4 grid grid-cols-2 gap-2.5">
                <Button tone="outline" size="md" onClick={() => setRejecting(a)}>
                  Reject
                </Button>
                <Button tone="leaf" size="md" icon={Check} onClick={() => decide(a, "approved")}>
                  Approve
                </Button>
              </View>
            </View>
          ))}
        </View>
      )}

      <Sheet
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        eyebrow="Reject"
        title={
          rejecting
            ? `${nameOf(rejecting.who).split(" ")[0]}'s ${KIND[rejecting.kind].label.toLowerCase()}`
            : ""
        }
      >
        <View className="space-y-5">
          <Field label="Note to requester" hint="optional">
            <TextInput
              className={cn(inputClass, "min-h-24 resize-none")}
              value={note}
              onChangeText={(text) => setNote(text)}
              placeholder="Why are you saying no?"
              multiline
            />
          </Field>
          <Button
            tone="coral"
            onClick={() => {
              if (rejecting) decide(rejecting, "rejected");
              setRejecting(null);
              setNote("");
            }}
          >
            Reject request
          </Button>
        </View>
      </Sheet>
    </Screen>
  );
}
