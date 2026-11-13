import { useRev } from "@/lib/store";
import { View, Text, Span, Pressable, TextInput } from "@/components/rn";
import { MapPin, Plus, Video } from "@/components/icons";
import { useState } from "react";
import { CallOverlay } from "@/components/rhinon/call";
import { AvatarStack, Badge, Button, Chip, Display, Eyebrow, Fab, Field, Screen, Segmented, Sheet, TopBar, inputClass, stagger } from "@/components/rhinon/ui";
import { createMeetingRemote } from "@/lib/live";
import { MEETINGS, nameOf, type Meeting } from "@/lib/mock-data";
import { actions } from "@/lib/store";
import { cn } from "@/lib/utils";
const SLOTS = ["10:30", "13:00", "15:30", "17:00"];
/** Minutes from now until hh:mm today (negative if it has passed). */
function minsUntil(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  return Math.round(((h ?? 0) * 60 + (m ?? 0) - (now.getHours() * 60 + now.getMinutes())));
}
export default function MeetingsPage() {
  useRev();
  const [day, setDay] = useState<"Today" | "Tomorrow">("Today");
  const [adding, setAdding] = useState(false);
  const [joining, setJoining] = useState<Meeting | null>(null);
  // Read the live calendar directly so sync (live-people) shows through; useRev() re-renders on replace.
  const rows = MEETINGS.filter(m => m.day === day).sort((a, b) => a.start.localeCompare(b.start));
  return <Screen fab>
      <TopBar title="Meetings" fallback="/more" />
      <View className="animate-rise">
        <Eyebrow tone="cobalt">{rows.length} on the calendar</Eyebrow>
        <Display size="hero" className="mt-3">
          Your
          {"\n"}
          day.
        </Display>
      </View>

      <Segmented className="mt-6" value={day} onChange={setDay} options={[{
      value: "Today",
      label: "Today"
    }, {
      value: "Tomorrow",
      label: "Tomorrow"
    }]} />

      <View className="mt-6 space-y-3">
        {day === "Today" ? <View className="flex items-center gap-4">
            <View className="w-[62px] shrink-0 text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-coral-deep">
              Now
            </View>
            <View className="size-2.5 shrink-0 rounded-full bg-coral" />
            <View className="h-px flex-1 bg-coral/50" />
            <Span className="font-mono text-[11px] text-coral-deep">{`${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, "0")}`}</Span>
          </View> : null}
        {rows.map((m, i) => {
        const next = m.state === "next";
        const client = m.kind === "client";
        return <View key={m.id} className="flex animate-rise gap-4" style={stagger(Math.min(i, 6))}>
              <View className="w-[62px] shrink-0 pt-4 text-right">
                <Text className="font-display text-[length:calc(32px*var(--ds))] font-black leading-none">
                  {m.start}
                </Text>
                <Text className="mt-1 font-mono text-[10.5px] text-ink/45">{m.end}</Text>
              </View>
              <View className={cn("min-w-0 flex-1 rounded-3xl p-4", next ? "bg-ink text-paper" : client ? "bg-coral text-coral-foreground" : "border border-line/70 bg-card")}>
                <View className="flex items-start justify-between gap-2">
                  <Text className="font-display text-[length:calc(28px*var(--ds))] font-black leading-[0.95]">
                    {m.title}
                  </Text>
                  {next ? <View className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-coral px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-coral-foreground">
                      <View className="size-1.5 animate-ping-soft rounded-full bg-coral-foreground" />
                      {minsUntil(m.start) > 0 ? `in ${minsUntil(m.start)} min` : "now"}
                    </View> : client ? <Badge tone="paper">Client</Badge> : null}
                </View>
                <View className={cn("mt-2 flex items-center gap-1.5 text-[13.5px]", next ? "text-paper/60" : client ? "opacity-85" : "text-ink/55")}>
                  <MapPin size={14} /> {m.where}
                </View>
                <View className="mt-3.5 flex items-center justify-between gap-3">
                  <AvatarStack names={m.people.map(nameOf)} size={28} max={4} ring={next ? "border-ink" : client ? "border-coral" : "border-card"} />
                  {m.where.includes("Meet") ? <Pressable onPress={() => setJoining(m)} className={cn("press inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-semibold", next ? "bg-paper text-ink" : client ? "bg-ink text-paper" : "bg-ink text-paper")}>
                      <Video size={16} /> Join
                    </Pressable> : null}
                </View>
              </View>
            </View>;
      })}
      </View>

      <Fab icon={Plus} label="New meeting" tone="cobalt" pushed onClick={() => setAdding(true)} />
      <NewMeetingSheet open={adding} onClose={() => setAdding(false)} day={day} onAdd={(title, slot) => {
      createMeetingRemote({ title, day, slot })
        .then(() => actions.toast("Meeting added · invite sent", "cobalt"))
        .catch(e => actions.toast(e instanceof Error ? e.message : "Could not add the meeting", "coral"));
    }} />
      <CallOverlay open={joining !== null} onClose={() => setJoining(null)} title={joining?.title ?? ""} names={(joining?.people ?? []).map(nameOf)} video />
    </Screen>;
}
function NewMeetingSheet({
  open,
  onClose,
  day,
  onAdd
}: {
  open: boolean;
  onClose: () => void;
  day: "Today" | "Tomorrow";
  onAdd: (title: string, slot: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [slot, setSlot] = useState(SLOTS[0] ?? "10:30");
  const [kind, setKind] = useState<Meeting["kind"]>("internal");
  const submit = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), slot);
    setTitle("");
    onClose();
  };
  return <Sheet open={open} onClose={onClose} eyebrow={`New meeting · ${day}`} title="What's it about?">
      <View className="space-y-5">
        <Field label="Title">
          <TextInput className={inputClass} value={title} onChangeText={text => setTitle(text)} placeholder="e.g. Release go / no-go" autoFocus />
        </Field>
        <Field label="Start">
          <View className="flex flex-wrap gap-2">
            {SLOTS.map(s => <Chip key={s} tone="cobalt" active={slot === s} onClick={() => setSlot(s)}>
                {s}
              </Chip>)}
          </View>
        </Field>
        <Field label="With">
          <View className="flex gap-2">
            <Chip active={kind === "internal"} onClick={() => setKind("internal")}>
              Team
            </Chip>
            <Chip tone="coral" active={kind === "client"} onClick={() => setKind("client")}>
              Client
            </Chip>
          </View>
        </Field>
        <Button tone="ink" onClick={submit} disabled={!title.trim()}>
          Add to calendar
        </Button>
      </View>
    </Sheet>;
}