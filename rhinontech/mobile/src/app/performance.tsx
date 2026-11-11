import { cycleLabel } from "@/lib/format";
import { useRev } from "@/lib/store";
import { View, Text, Span, Pressable, TextInput } from "@/components/rn";
import { Slider } from "@/components/rhinon/slider";
import { Check, Plus } from "@/components/icons";
import { useState } from "react";
import { RatingPicker } from "@/components/rhinon/rating";
import {
  Avatar,
  Badge,
  Button,
  Chip,
  Display,
  Eyebrow,
  Fab,
  Field,
  ProgressBar,
  Screen,
  SectionLabel,
  Segmented,
  Sheet,
  TopBar,
  inputClass,
  stagger,
} from "@/components/rhinon/ui";
import { nameOf } from "@/lib/mock-data";
import {
  PAST_REVIEWS,
  RATING_LABELS,
  goalState,
  type Goal,
  type TeamReview,
} from "@/lib/mock-more";
import { actions, useApp, usePerm } from "@/lib/store";
import type { Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";
type Tab = "goals" | "reviews" | "team";
const STATE_TONE: Record<ReturnType<typeof goalState>, Tone> = {
  Done: "violet",
  "On track": "leaf",
  "At risk": "coral",
};
const TEAM_TONE: Record<TeamReview["status"], Tone> = {
  "Not started": "ink",
  "Self-review in": "sky",
  "Your review due": "coral",
  Completed: "leaf",
};
export default function PerformancePage() {
  useRev();
  const goals = useApp((s) => s.goals);
  const self = useApp((s) => s.selfReview);
  const team = useApp((s) => s.teamReviews);
  const canTeam = usePerm("approvals");
  const [tab, setTab] = useState<Tab>("goals");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const avg = goals.length
    ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
    : 0;
  const atRisk = goals.filter((g) => goalState(g) === "At risk").length;
  const goal = goals.find((g) => g.id === editing);
  const member = team.find((t) => t.id === reviewing);
  return (
    <Screen fab={tab === "goals"}>
      <TopBar title="Performance" fallback="/more" />
      <View className="animate-rise">
        <Eyebrow tone="violet">{cycleLabel()} · {goals.length} goals</Eyebrow>
        <Display size="hero" className="mt-3">
          Grow,
          {"\n"}
          on record.
        </Display>
      </View>

      <Segmented
        className="mt-6"
        value={tab}
        onChange={setTab}
        options={[
          {
            value: "goals",
            label: "Goals",
          },
          {
            value: "reviews",
            label: "Reviews",
            badge: self.submitted ? undefined : 1,
          },
          ...(canTeam
            ? [
                {
                  value: "team" as const,
                  label: "Team",
                  badge: team.filter((t) => t.status === "Your review due").length || undefined,
                },
              ]
            : []),
        ]}
      />

      {tab === "goals" ? (
        <View className="mt-5">
          <View className="animate-rise rounded-3xl bg-violet p-5 text-violet-foreground">
            <View className="flex items-end justify-between">
              <Text className="font-display text-[length:calc(84px*var(--ds))] leading-[0.8]">
                {avg}
                <Span className="text-[length:calc(40px*var(--ds))] opacity-70">%</Span>
              </Text>
              <Text className="pb-1 text-right font-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] opacity-90">
                average
                {"\n"}
                progress
              </Text>
            </View>
            <ProgressBar value={avg / 100} tone="paper" track="bg-paper/25" className="mt-4" />
            <Text className="mt-3 text-[14px] opacity-90">
              {atRisk === 0
                ? "Everything is on track."
                : `${atRisk} ${atRisk === 1 ? "goal needs" : "goals need"} attention.`}
            </Text>
          </View>

          <View className="mt-4 space-y-2.5">
            {goals.map((g, i) => {
              const st = goalState(g);
              return (
                <View key={g.id} className="animate-rise" style={stagger(Math.min(i, 6))}>
                  <Pressable
                    onPress={() => setEditing(g.id)}
                    className="press w-full rounded-3xl border border-line/70 bg-card p-4 text-left"
                  >
                    <View className="flex items-start justify-between gap-3">
                      <Text className="text-[16px] font-semibold leading-snug">{g.title}</Text>
                      <Badge tone={STATE_TONE[st]}>{st}</Badge>
                    </View>
                    <Text className="mt-1 text-[13.5px] text-ink/55">{g.keyResult}</Text>
                    <View className="mt-3.5 flex items-center gap-3">
                      <ProgressBar
                        value={g.progress / 100}
                        tone={STATE_TONE[st]}
                        className="flex-1"
                      />
                      <View className="w-10 text-right font-display text-[length:calc(24px*var(--ds))] leading-none">
                        {g.progress}%
                      </View>
                    </View>
                    <Text className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45">
                      {g.cycle} · due {g.due}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {tab === "reviews" ? (
        <View className="mt-5 space-y-3">
          <View className="rounded-3xl border border-line/70 bg-card p-5">
            <View className="flex items-start justify-between gap-3">
              <View>
                <Eyebrow tone="muted">Current cycle</Eyebrow>
                <Display as="h3" size="lg" className="mt-1.5">
                  {cycleLabel()} review
                </Display>
              </View>
              <Badge tone={self.submitted ? "leaf" : "coral"}>
                {self.submitted ? "Submitted" : "Due 20 Nov"}
              </Badge>
            </View>
            <View className="mt-4 space-y-2.5">
              {[
                ["Self-review", self.submitted ? "Done" : "Due 20 Nov", self.submitted],
                ["Manager review", "Due 27 Nov", false],
                ["Released to you", "Early December", false],
              ].map(([label, when, ok]) => (
                <View key={String(label)} className="flex items-center gap-3">
                  <View
                    className={cn(
                      "grid size-7 place-items-center rounded-full border-2",
                      ok ? "border-leaf bg-leaf text-leaf-foreground" : "border-ink/25",
                    )}
                  >
                    {ok ? <Check size={15} strokeWidth={3} /> : null}
                  </View>
                  <View className="flex-1 text-[15px] font-medium">{label}</View>
                  <Span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/50">
                    {when}
                  </Span>
                </View>
              ))}
            </View>
            {self.submitted ? (
              <View className="mt-4 rounded-2xl bg-paper-deep p-4">
                <Text className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">
                  Your self-rating
                </Text>
                <Text className="mt-1 font-display text-[length:calc(40px*var(--ds))] leading-none">
                  {self.rating}/5{" "}
                  <Span className="text-[length:calc(20px*var(--ds))] text-ink/55">
                    {RATING_LABELS[(self.rating ?? 1) - 1]}
                  </Span>
                </Text>
                <Text className="mt-2 text-[14px] text-ink/70">{self.strengths}</Text>
              </View>
            ) : (
              <Button tone="ink" className="mt-5" onClick={() => setWriting(true)}>
                Write your self-review
              </Button>
            )}
          </View>

          <SectionLabel className="mb-1 mt-6">Past reviews</SectionLabel>
          {PAST_REVIEWS.map((r) => (
            <View key={r.id} className="rounded-3xl border border-line/70 bg-card p-5">
              <View className="flex items-end justify-between">
                <Text className="font-display text-[length:calc(56px*var(--ds))] leading-[0.8]">
                  {r.rating}
                  <Span className="text-[length:calc(26px*var(--ds))] text-ink/45">/5</Span>
                </Text>
                <Badge tone="violet">{r.label}</Badge>
              </View>
              <Text className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink/50">
                {r.cycle} · from {nameOf(r.manager)}
              </Text>
              <Text className="mt-2 text-[15px] leading-relaxed text-ink/80">“{r.comment}”</Text>
            </View>
          ))}
        </View>
      ) : null}

      {tab === "team" && canTeam ? (
        <View className="mt-4 space-y-2.5">
          {team.map((t, i) => (
            <View key={t.id} className="animate-rise" style={stagger(Math.min(i, 6))}>
              <Pressable
                onPress={() => setReviewing(t.id)}
                className="press flex w-full items-center gap-3.5 rounded-2xl border border-line/70 bg-card p-3.5 text-left"
              >
                <Avatar name={nameOf(t.who)} size={48} />
                <View className="min-w-0 flex-1">
                  <View className="block truncate text-[16px] font-semibold leading-tight">
                    {nameOf(t.who)}
                  </View>
                  <View className="mt-0.5 block font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/50">
                    {t.selfRating ? `Self ${t.selfRating}/5` : "No self-review yet"}
                    {t.managerRating ? ` · You ${t.managerRating}/5` : ""}
                  </View>
                </View>
                <Badge tone={TEAM_TONE[t.status]}>{t.status}</Badge>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {tab === "goals" ? (
        <Fab icon={Plus} label="New goal" tone="violet" onClick={() => setAdding(true)} />
      ) : null}

      <GoalSheet goal={goal} onClose={() => setEditing(null)} />
      <NewGoalSheet open={adding} onClose={() => setAdding(false)} />
      <SelfReviewSheet open={writing} onClose={() => setWriting(false)} />
      <TeamReviewSheet item={member} onClose={() => setReviewing(null)} />
    </Screen>
  );
}
function GoalSheet({ goal, onClose }: { goal: Goal | undefined; onClose: () => void }) {
  return (
    <Sheet
      open={goal !== undefined}
      onClose={onClose}
      eyebrow={goal ? `${goal.cycle} · due ${goal.due}` : ""}
    >
      {goal ? (
        <View>
          <Display as="h2" size="md">
            {goal.title}
          </Display>
          <Text className="mt-2 text-[14.5px] text-ink/60">{goal.keyResult}</Text>
          <Text className="mt-6 font-display text-[length:calc(96px*var(--ds))] leading-[0.8]">
            {goal.progress}
            <Span className="text-[length:calc(44px*var(--ds))] text-ink/45">%</Span>
          </Text>
          <Slider
            min={0}
            max={100}
            step={5}
            value={goal.progress}
            onChange={(v) => actions.setGoalProgress(goal.id, v)}
            accessibilityLabel="Progress"
            className="mt-5 w-full"
          />
          <View className="mt-4 flex flex-wrap gap-2">
            {[25, 50, 75, 100].map((n) => (
              <Chip
                key={n}
                tone="violet"
                active={goal.progress === n}
                onClick={() => actions.setGoalProgress(goal.id, n)}
              >
                {n}%
              </Chip>
            ))}
          </View>
          <Button tone="ink" className="mt-6" onClick={onClose}>
            Done
          </Button>
        </View>
      ) : null}
    </Sheet>
  );
}
function NewGoalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [kr, setKr] = useState("");
  const [due, setDue] = useState("31 Dec");
  const save = () => {
    if (!title.trim()) return;
    actions.addGoal(title.trim(), kr.trim() || "Define the measurable result", due);
    setTitle("");
    setKr("");
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} eyebrow={cycleLabel()} title="What will you achieve?">
      <View className="space-y-5">
        <Field label="Goal">
          <TextInput
            className={inputClass}
            value={title}
            onChangeText={(text) => setTitle(text)}
            placeholder="e.g. Cut export time in half"
            autoFocus
          />
        </Field>
        <Field label="Key result" hint="how you'll know">
          <TextInput
            className={inputClass}
            value={kr}
            onChangeText={(text) => setKr(text)}
            placeholder="e.g. p95 under 3 seconds"
          />
        </Field>
        <Field label="Due">
          <View className="flex gap-2">
            {["30 Nov", "15 Dec", "31 Dec"].map((d) => (
              <Chip key={d} tone="violet" active={due === d} onClick={() => setDue(d)}>
                {d}
              </Chip>
            ))}
          </View>
        </Field>
        <Button tone="ink" disabled={!title.trim()} onClick={save}>
          Add goal
        </Button>
      </View>
    </Sheet>
  );
}
function SelfReviewSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rating, setRating] = useState<number | null>(null);
  const [strengths, setStrengths] = useState("");
  const [growth, setGrowth] = useState("");
  const send = () => {
    if (!rating) return;
    actions.submitSelfReview(rating, strengths.trim() || "—", growth.trim() || "—");
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} eyebrow={cycleLabel()} title="How did it go?">
      <View className="space-y-5">
        <Field label="Overall, you were">
          <RatingPicker value={rating} onChange={setRating} />
        </Field>
        <Field label="What went well">
          <TextInput
            className={cn(inputClass, "min-h-24 resize-none")}
            value={strengths}
            onChangeText={(text) => setStrengths(text)}
            placeholder="Shipped, unblocked, taught…"
            multiline
          />
        </Field>
        <Field label="Where you want to grow">
          <TextInput
            className={cn(inputClass, "min-h-24 resize-none")}
            value={growth}
            onChangeText={(text) => setGrowth(text)}
            placeholder="Skills, scope, habits…"
            multiline
          />
        </Field>
        <Button tone="ink" disabled={!rating} onClick={send}>
          Submit to your manager
        </Button>
      </View>
    </Sheet>
  );
}
function TeamReviewSheet({ item, onClose }: { item: TeamReview | undefined; onClose: () => void }) {
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const done = item?.status === "Completed";
  const send = () => {
    if (!item || !rating) return;
    actions.submitTeamReview(item.id, rating, notes.trim() || "—");
    setRating(null);
    setNotes("");
    onClose();
  };
  return (
    <Sheet open={item !== undefined} onClose={onClose} eyebrow={item ? item.status : ""}>
      {item ? (
        <View className="space-y-5">
          <View className="flex items-center gap-4">
            <Avatar name={nameOf(item.who)} size={60} />
            <Display as="h2" size="md">
              {nameOf(item.who)}
            </Display>
          </View>
          <View className="rounded-3xl border border-line/70 bg-card p-4">
            <Text className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">
              Their self-review
            </Text>
            {item.selfRating ? (
              <>
                <Text className="mt-1 font-display text-[length:calc(36px*var(--ds))] leading-none">
                  {item.selfRating}/5
                </Text>
                <Text className="mt-2 text-[14.5px] leading-relaxed text-ink/75">
                  {item.selfNotes}
                </Text>
              </>
            ) : (
              <Text className="mt-1 text-[14.5px] text-ink/55">Not submitted yet.</Text>
            )}
          </View>
          {done ? (
            <View className="rounded-3xl bg-leaf/15 p-4">
              <Text className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">
                Your review
              </Text>
              <Text className="mt-1 font-display text-[length:calc(36px*var(--ds))] leading-none">
                {item.managerRating}/5
              </Text>
              <Text className="mt-2 text-[14.5px] leading-relaxed text-ink/75">
                {item.managerNotes}
              </Text>
            </View>
          ) : (
            <>
              <Field label="Your rating">
                <RatingPicker value={rating} onChange={setRating} />
              </Field>
              <Field label="Feedback">
                <TextInput
                  className={cn(inputClass, "min-h-24 resize-none")}
                  value={notes}
                  onChangeText={(text) => setNotes(text)}
                  placeholder="What they did well, and what's next"
                  multiline
                />
              </Field>
              <Button tone="ink" disabled={!rating} onClick={send}>
                Submit review
              </Button>
            </>
          )}
        </View>
      ) : null}
    </Sheet>
  );
}
