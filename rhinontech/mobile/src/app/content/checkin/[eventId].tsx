import { useRev } from "@/lib/store";
import { View, Text, Span, Pressable, TextInput } from "@/components/rn";
import { useLocalSearchParams } from "expo-router";
import { Check, ScanLine, Search } from "@/components/icons";
import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Chip,
  Display,
  Empty,
  Eyebrow,
  ProgressBar,
  Screen,
  TopBar,
  inputClass,
} from "@/components/rhinon/ui";
import { EVENTS, type Guest } from "@/lib/mock-more";
import { actions, useApp } from "@/lib/store";
import type { Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";
const TICKET_TONE: Record<Guest["ticket"], Tone> = {
  General: "sky",
  VIP: "sun",
  Speaker: "violet",
};
export default function CheckInPage() {
  useRev();
  const { eventId } = useLocalSearchParams<{
    eventId: string;
  }>();
  const event = EVENTS.find((e) => e.id === eventId);
  const guests = useApp((s) => s.guests[eventId] ?? []);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"All" | "Waiting" | "In">("All");
  const [last, setLast] = useState<
    | {
        name: string;
        ticket: Guest["ticket"];
      }
    | "done"
    | null
  >(null);
  if (!event) {
    return (
      <Screen>
        <TopBar title="Check-in" fallback="/content" />
        <Empty title="Event not found" body="It may have been cancelled." tone="rose" />
      </Screen>
    );
  }
  const inside = guests.filter((g) => g.checkedIn).length;
  const query = q.trim().toLowerCase();
  const rows = guests
    .filter((g) => (filter === "All" ? true : filter === "In" ? g.checkedIn : !g.checkedIn))
    .filter(
      (g) =>
        !query || g.name.toLowerCase().includes(query) || g.company.toLowerCase().includes(query),
    );
  const scan = () => {
    const g = actions.scanNext(eventId);
    setLast(
      g
        ? {
            name: g.name,
            ticket: g.ticket,
          }
        : "done",
    );
  };
  return (
    <Screen>
      <TopBar title="Check-in" fallback="/content" />
      <Eyebrow tone="rose">{event.title}</Eyebrow>
      <Text className="mt-2 font-display text-[length:calc(84px*var(--ds))] leading-[0.8]">
        {inside}
        <Span className="text-[length:calc(42px*var(--ds))] text-ink/45">/{guests.length}</Span>
      </Text>
      <ProgressBar
        value={guests.length ? inside / guests.length : 0}
        tone="rose"
        className="mt-4"
      />
      <Text className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink/50">
        checked in · {event.when}
      </Text>

      <View className="mt-5 overflow-hidden rounded-3xl bg-ink p-4 text-paper">
        <View className="relative mx-auto grid aspect-square w-full max-w-[220px] place-items-center">
          {(
            [
              "left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl",
              "right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl",
              "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl",
              "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl",
            ] as const
          ).map((c) => (
            <View key={c} className={cn("absolute size-9 border-on-ink-accent", c)} />
          ))}
          <View className="absolute inset-x-5 h-0.5 animate-scan rounded-full bg-on-ink-accent" />
          <ScanLine size={64} strokeWidth={1.2} className="text-paper/30" />
        </View>
        <Text className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-paper/60">
          Point at a guest's QR code
        </Text>
        <Button tone="paper" className="mt-4" icon={ScanLine} onClick={scan}>
          Simulate a scan
        </Button>
        {last ? (
          <View className="mt-3 flex animate-pop items-center gap-3 rounded-2xl bg-leaf p-3.5 text-leaf-foreground">
            <View className="grid size-9 place-items-center rounded-full bg-paper/25">
              <Check size={20} strokeWidth={3} />
            </View>
            <Text className="min-w-0 text-[15px] font-semibold leading-tight">
              {last === "done" ? "Everyone is already in" : `${last.name} · ${last.ticket}`}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="relative mt-5 block">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
        />
        <TextInput
          className={cn(inputClass, "rounded-full py-3.5 pl-11")}
          placeholder="Find a guest by name or company"
          accessibilityLabel="Find a guest"
          value={q}
          onChangeText={(text) => setQ(text)}
        />
      </View>
      <View className="mt-3 flex gap-2">
        {(["All", "Waiting", "In"] as const).map((f) => (
          <Chip key={f} tone="rose" active={filter === f} onClick={() => setFilter(f)}>
            {f}
          </Chip>
        ))}
      </View>

      <View className="mt-2">
        {rows.map((g) => (
          <View key={g.id} className="border-b border-line/70 last:border-0">
            <Pressable
              onPress={() => actions.checkIn(eventId, g.id, !g.checkedIn)}
              className="press flex w-full items-center gap-3.5 py-3 text-left"
            >
              <Avatar name={g.name} size={44} />
              <View className="min-w-0 flex-1">
                <View className="block truncate font-semibold leading-tight">{g.name}</View>
                <View className="block truncate text-[13px] text-ink/55">{g.company}</View>
              </View>
              <Badge tone={TICKET_TONE[g.ticket]}>{g.ticket}</Badge>
              <View
                className={cn(
                  "grid size-8 place-items-center rounded-full border-2 transition-colors",
                  g.checkedIn ? "border-leaf bg-leaf text-leaf-foreground" : "border-ink/25",
                )}
              >
                {g.checkedIn ? <Check size={16} strokeWidth={3} /> : null}
              </View>
            </Pressable>
          </View>
        ))}
        {rows.length === 0 ? (
          <Empty tone="rose" title="No guests" body="Nobody matches that search." />
        ) : null}
      </View>
      <Display as="p" size="sm" className="sr-only">
        {inside} of {guests.length} checked in
      </Display>
    </Screen>
  );
}
