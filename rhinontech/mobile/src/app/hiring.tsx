import { View, Text, Span, Pressable, TextInput } from "@/components/rn";
import { Video } from "@/components/icons";
import { useState } from "react";
import { AttachmentRow, PreviewSheet } from "@/components/rhinon/attach";
import { CallOverlay } from "@/components/rhinon/call";
import { RatingPicker } from "@/components/rhinon/rating";
import {
  Avatar,
  Badge,
  Button,
  Chip,
  Display,
  Eyebrow,
  Field,
  NoAccess,
  Screen,
  SectionLabel,
  Segmented,
  Sheet,
  TopBar,
  inputClass,
  stagger,
} from "@/components/rhinon/ui";
import {
  HIRING_STAGES,
  OPENINGS,
  type Attachment,
  type Candidate,
  type HiringStage,
  type Interview,
} from "@/lib/mock-more";
import { actions, useApp, usePerm } from "@/lib/store";
import { TONES, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";
type Tab = "interviews" | "board" | "openings";
const STAGE_TONE: Record<HiringStage, Tone> = {
  Applied: "sky",
  Screen: "sun",
  Interview: "cobalt",
  Offer: "violet",
  Hired: "leaf",
};
const FEEDBACK_LABELS = ["Strong no", "No", "Mixed", "Yes", "Strong yes"];
const DAYS: Interview["day"][] = ["Yesterday", "Today", "Tomorrow", "Fri"];
export default function HiringPage() {
  const candidates = useApp((s) => s.candidates);
  const interviews = useApp((s) => s.interviews);
  const allowed = usePerm("hiring");
  const [tab, setTab] = useState<Tab>("interviews");
  const [profile, setProfile] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [joining, setJoining] = useState<string | null>(null);
  const [resume, setResume] = useState<Attachment | null>(null);
  if (!allowed) {
    return (
      <Screen>
        <TopBar title="Hiring" fallback="/more" />
        <NoAccess
          title="Interviewers only"
          body="Hiring is for managers, HR and admins who are part of an interview loop."
        />
      </Screen>
    );
  }
  const who = (id: string) => candidates.find((c) => c.id === id);
  const due = interviews.filter((i) => i.rating === null && i.day === "Yesterday").length;
  const cand = candidates.find((c) => c.id === profile);
  const fbInterview = interviews.find((i) => i.id === feedback);
  const joinCand = who(interviews.find((i) => i.id === joining)?.candidateId ?? "");
  return (
    <Screen>
      <TopBar title="Hiring" fallback="/more" />
      <View className="animate-rise">
        <Eyebrow tone="leaf">
          {interviews.filter((i) => i.day === "Today").length} interviews today · {due} feedback due
        </Eyebrow>
        <Display size="hero" className="mt-3">
          Who's
          {"\n"}
          next?
        </Display>
      </View>

      <Segmented
        className="mt-6"
        value={tab}
        onChange={setTab}
        options={[
          {
            value: "interviews",
            label: "Mine",
            badge: due || undefined,
          },
          {
            value: "board",
            label: "Board",
          },
          {
            value: "openings",
            label: "Roles",
          },
        ]}
      />

      {tab === "interviews" ? (
        <View className="mt-5">
          {DAYS.map((day) => {
            const rows = interviews.filter((i) => i.day === day);
            if (rows.length === 0) return null;
            return (
              <View key={day} className="mb-6">
                <SectionLabel className="mb-3">{day}</SectionLabel>
                <View className="space-y-3">
                  {rows.map((iv, i) => {
                    const c = who(iv.candidateId);
                    if (!c) return null;
                    const past = iv.day === "Yesterday";
                    return (
                      <View
                        key={iv.id}
                        className={cn(
                          "animate-rise rounded-3xl p-4",
                          iv.day === "Today"
                            ? "bg-leaf text-leaf-foreground"
                            : "border border-line/70 bg-card",
                        )}
                        style={stagger(Math.min(i, 5))}
                      >
                        <View className="flex items-start gap-3.5">
                          <Text className="w-[62px] shrink-0 font-display text-[length:calc(34px*var(--ds))] leading-none">
                            {iv.time}
                          </Text>
                          <View className="min-w-0 flex-1">
                            <Text className="truncate text-[17px] font-semibold leading-tight">
                              {c.name}
                            </Text>
                            <Text
                              className={cn(
                                "truncate text-[13.5px]",
                                iv.day === "Today" ? "opacity-85" : "text-ink/55",
                              )}
                            >
                              {iv.round} · {c.role}
                            </Text>
                            <Text
                              className={cn(
                                "mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.1em]",
                                iv.day === "Today" ? "opacity-80" : "text-ink/45",
                              )}
                            >
                              {iv.where}
                            </Text>
                          </View>
                          <Avatar name={c.name} size={44} />
                        </View>
                        <View className="mt-3.5 flex flex-wrap items-center gap-2">
                          {iv.rating !== null ? (
                            <Badge tone={iv.day === "Today" ? "paper" : "leaf"}>
                              Feedback in · {iv.rating}/5 · {iv.rec}
                            </Badge>
                          ) : null}
                          <Pressable
                            onPress={() => setProfile(c.id)}
                            className={cn(
                              "press h-10 rounded-full border px-4 text-[13.5px] font-semibold",
                              iv.day === "Today" ? "border-paper/40" : "border-ink/20",
                            )}
                          >
                            Profile
                          </Pressable>
                          {iv.where.includes("Meet") && !past ? (
                            <Pressable
                              onPress={() => setJoining(iv.id)}
                              className="press inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-[13.5px] font-semibold text-paper"
                            >
                              <Video size={15} /> Join
                            </Pressable>
                          ) : null}
                          {iv.rating === null && (past || iv.day === "Today") ? (
                            <Pressable
                              onPress={() => setFeedback(iv.id)}
                              className={cn(
                                "press h-10 rounded-full px-4 text-[13.5px] font-semibold",
                                past
                                  ? TONES.coral.solid
                                  : iv.day === "Today"
                                    ? "bg-paper text-ink"
                                    : "bg-ink text-paper",
                              )}
                            >
                              {past ? "Feedback due" : "Give feedback"}
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {tab === "board" ? (
        <View className="no-scrollbar -mx-5 mt-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-2">
          {HIRING_STAGES.map((st) => {
            const col = candidates.filter((c) => c.stage === st);
            return (
              <View key={st} className="w-[256px] shrink-0 snap-start" accessibilityLabel={st}>
                <View className="mb-3">
                  <View
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-full px-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em]",
                      TONES[STAGE_TONE[st]].solid,
                    )}
                  >
                    {st}
                    <Span className="opacity-70">{col.length}</Span>
                  </View>
                </View>
                <View className="space-y-2.5">
                  {col.length === 0 ? (
                    <View className="rounded-2xl border-2 border-dashed border-ink/15 px-4 py-8 text-center text-[13px] text-ink/40">
                      Nobody here
                    </View>
                  ) : null}
                  {col.map((c) => (
                    <View key={c.id}>
                      <Pressable
                        onPress={() => setProfile(c.id)}
                        className="press w-full rounded-2xl border border-line/70 bg-card p-3.5 text-left"
                      >
                        <View className="flex items-center gap-3">
                          <Avatar name={c.name} size={36} />
                          <View className="min-w-0">
                            <View className="block truncate text-[15px] font-semibold leading-tight">
                              {c.name}
                            </View>
                            <View className="block truncate text-[12.5px] text-ink/55">
                              {c.role}
                            </View>
                          </View>
                        </View>
                        <Text className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45">
                          {c.exp} · {c.source}
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {tab === "openings" ? (
        <View className="mt-5 space-y-3">
          {OPENINGS.map((o, i) => (
            <View
              key={o.id}
              className="animate-rise rounded-3xl border border-line/70 bg-card p-4"
              style={stagger(i)}
            >
              <View className="flex items-start justify-between gap-3">
                <Text className="text-[17px] font-semibold leading-snug">{o.title}</Text>
                <Badge tone={o.state === "Open" ? "leaf" : "sun"}>{o.state}</Badge>
              </View>
              <Text className="mt-1 text-[13.5px] text-ink/55">
                {o.dept} · {o.where}
              </Text>
              <View className="mt-3.5 flex items-end justify-between">
                <Text className="font-display text-[length:calc(40px*var(--ds))] leading-none">
                  {o.candidates}
                  <Span className="ml-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink/50">
                    candidates
                  </Span>
                </Text>
                <Span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/45">
                  Posted {o.posted}
                </Span>
              </View>
            </View>
          ))}
          <View className="pt-2 text-center text-[13px] text-ink/50">
            Creating or editing a role stays on the web.
          </View>
        </View>
      ) : null}

      <ProfileSheet cand={cand} onClose={() => setProfile(null)} onResume={setResume} />
      <FeedbackSheet
        iv={fbInterview}
        cand={who(fbInterview?.candidateId ?? "")}
        onClose={() => setFeedback(null)}
      />
      <CallOverlay
        open={joining !== null}
        onClose={() => setJoining(null)}
        title={joinCand?.name ?? ""}
        names={joinCand ? [joinCand.name] : []}
        video
      />
      <PreviewSheet file={resume} onClose={() => setResume(null)} />
    </Screen>
  );
}
function ProfileSheet({
  cand,
  onClose,
  onResume,
}: {
  cand: Candidate | undefined;
  onClose: () => void;
  onResume: (f: Attachment) => void;
}) {
  return (
    <Sheet
      open={cand !== undefined}
      onClose={onClose}
      eyebrow={cand ? `${cand.role} · ${cand.exp}` : ""}
    >
      {cand ? (
        <View>
          <View className="flex items-center gap-4">
            <Avatar name={cand.name} size={64} />
            <View className="min-w-0">
              <Display as="h2" size="md">
                {cand.name}
              </Display>
              <View className="mt-1.5 flex gap-2">
                <Badge tone={STAGE_TONE[cand.stage]}>{cand.stage}</Badge>
                <Badge tone="ink" dot={false}>
                  {cand.source}
                </Badge>
              </View>
            </View>
          </View>
          <Text className="mt-5 text-[15.5px] leading-relaxed text-ink/80">{cand.summary}</Text>
          <Text className="mb-2 mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">
            Resume
          </Text>
          <AttachmentRow
            file={{
              id: `res-${cand.id}`,
              name: `${cand.name.replace(" ", "-")}-resume.pdf`,
              kind: "pdf",
              size: "186 KB",
            }}
            onOpen={onResume}
          />
        </View>
      ) : null}
    </Sheet>
  );
}
function FeedbackSheet({
  iv,
  cand,
  onClose,
}: {
  iv: Interview | undefined;
  cand: Candidate | undefined;
  onClose: () => void;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [rec, setRec] = useState<NonNullable<Interview["rec"]> | null>(null);
  const [notes, setNotes] = useState("");
  const send = () => {
    if (!iv || !rating || !rec) return;
    actions.submitFeedback(iv.id, rating, rec, notes.trim() || "—");
    setRating(null);
    setRec(null);
    setNotes("");
    onClose();
  };
  return (
    <Sheet
      open={iv !== undefined}
      onClose={onClose}
      eyebrow={iv ? `${iv.round} · ${cand?.name ?? ""}` : ""}
      title="How did it go?"
    >
      <View className="space-y-5">
        <Field label="Your rating">
          <RatingPicker value={rating} onChange={setRating} labels={FEEDBACK_LABELS} />
        </Field>
        <Field label="Recommendation">
          <View className="flex gap-2">
            {(["Hire", "Maybe", "No hire"] as const).map((r) => (
              <Chip
                key={r}
                tone={r === "Hire" ? "leaf" : r === "Maybe" ? "sun" : "coral"}
                active={rec === r}
                onClick={() => setRec(r)}
              >
                {r}
              </Chip>
            ))}
          </View>
        </Field>
        <Field label="Notes">
          <TextInput
            className={cn(inputClass, "min-h-28 resize-none")}
            value={notes}
            onChangeText={(text) => setNotes(text)}
            placeholder="Strengths, concerns, what you asked"
            multiline
          />
        </Field>
        <Button tone="ink" disabled={!rating || !rec} onClick={send}>
          Submit feedback
        </Button>
      </View>
    </Sheet>
  );
}
