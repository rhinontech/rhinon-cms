import { useRev } from "@/lib/store";
import { Portal, View, Text, Pressable } from "@/components/rn";
import {
  BadgeCheck,
  CalendarDays,
  ListChecks,
  Mail,
  MessageCircle,
  Wallet,
  type LucideIcon,
} from "@/components/icons";
import { useState } from "react";
import { AppLink, Button, Display, Eyebrow, Screen, TopBar, stagger } from "@/components/rhinon/ui";
import type { Notif } from "@/lib/mock-data";
import { actions, useApp } from "@/lib/store";
import { TONES, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";
const KIND: Record<
  Notif["kind"],
  {
    icon: LucideIcon;
    tone: Tone;
  }
> = {
  task: {
    icon: ListChecks,
    tone: "cobalt",
  },
  leave: {
    icon: CalendarDays,
    tone: "leaf",
  },
  chat: {
    icon: MessageCircle,
    tone: "sky",
  },
  inbox: {
    icon: Mail,
    tone: "coral",
  },
  pay: {
    icon: Wallet,
    tone: "sun",
  },
  approval: {
    icon: BadgeCheck,
    tone: "violet",
  },
};
export default function NotificationsPage() {
  useRev();
  const notifs = useApp((s) => s.notifs);
  const push = useApp((s) => s.pushPermission);
  const [asking, setAsking] = useState(false);
  const fresh = notifs.filter((n) => n.unread).length;
  const groups: Notif["group"][] = ["Today", "Earlier"];
  return (
    <Screen>
      <TopBar
        title="Notifications"
        fallback="/"
        right={
          fresh > 0 ? (
            <Pressable
              onPress={actions.readAllNotifs}
              className="press h-11 rounded-full border border-ink/15 bg-card px-4 font-mono text-[11px] font-medium uppercase tracking-[0.12em]"
            >
              Read all
            </Pressable>
          ) : null
        }
      />
      <View className="animate-rise">
        <Eyebrow tone="coral">{fresh} new</Eyebrow>
        <Display size="hero" className="mt-3">
          What's
          {"\n"}
          new.
        </Display>
      </View>

      {push === "unasked" ? (
        <View className="mt-6 animate-rise rounded-[calc(var(--radius)+12px)] bg-ink p-5 text-paper">
          <Eyebrow className="text-on-ink-accent">Don't miss a thing</Eyebrow>
          <Display as="h2" size="lg" className="mt-2 text-paper">
            Approvals and mentions, the moment they happen
          </Display>
          <View className="mt-5 grid grid-cols-[1fr_auto] items-center gap-2.5">
            <Button tone="paper" size="md" onClick={() => setAsking(true)}>
              Turn on notifications
            </Button>
            <Pressable
              onPress={() => actions.setPush("denied")}
              className="press h-12 px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-paper/60"
            >
              Not now
            </Pressable>
          </View>
        </View>
      ) : null}
      <PushAlert
        open={asking}
        onAnswer={(a) => {
          setAsking(false);
          actions.setPush(a);
        }}
      />

      {groups.map((g) => {
        const rows = notifs.filter((n) => n.group === g);
        if (rows.length === 0) return null;
        return (
          <View key={g} className="mt-7">
            <Text className="mb-1 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-ink/50">
              {g}
            </Text>
            <View>
              {rows.map((n, i) => {
                const k = KIND[n.kind];
                const Icon = k.icon;
                return (
                  <View
                    key={n.id}
                    className="press relative animate-rise border-b border-line/70 last:border-0"
                    style={stagger(Math.min(i, 6))}
                  >
                    <AppLink
                      to={n.to}
                      aria-label={n.title}
                      onClick={() => actions.readNotif(n.id)}
                      className="absolute inset-0 z-0"
                    />
                    {n.unread ? (
                      <View className="absolute -left-3.5 top-[34px] size-2 rounded-full bg-coral" />
                    ) : null}
                    <View className="pointer-events-none relative z-10 flex gap-3.5 py-4">
                      <View
                        className={cn(
                          "grid size-12 shrink-0 place-items-center rounded-2xl",
                          TONES[k.tone].solid,
                        )}
                      >
                        <Icon size={22} strokeWidth={2} />
                      </View>
                      <View className="min-w-0 flex-1">
                        <View className="flex items-baseline justify-between gap-2">
                          <Text
                            className={cn(
                              "text-[15.5px] leading-snug",
                              n.unread ? "font-bold" : "font-medium text-ink/80",
                            )}
                          >
                            {n.title}
                          </Text>
                          <View className="shrink-0 font-mono text-[10.5px] text-ink/45">
                            {n.time}
                          </View>
                        </View>
                        <Text className="mt-0.5 text-[14px] leading-snug text-ink/55">
                          {n.body}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

/** The system permission alert, drawn the way a phone draws it: centred, two choices. */
function PushAlert({
  open,
  onAnswer,
}: {
  open: boolean;
  onAnswer: (a: "granted" | "denied") => void;
}) {
  if (!open) return null;
  return (<Portal>
    <View className="pointer-events-auto absolute inset-0 z-[56] grid animate-fade-in place-items-center bg-ink/55 px-10">
      <View
        accessibilityLabel="Notification permission"
        className="w-full animate-pop overflow-hidden rounded-3xl bg-paper text-center"
      >
        <View className="px-5 pb-5 pt-6">
          <Text className="text-[17px] font-semibold leading-snug">
            “Rhinon” Would Like to Send You Notifications
          </Text>
          <Text className="mt-2 text-[13.5px] leading-snug text-ink/60">
            Alerts, sounds and badges for approvals, mentions and tasks that are due.
          </Text>
        </View>
        <View className="grid grid-cols-2 border-t border-line">
          <Pressable
            onPress={() => onAnswer("denied")}
            className="press h-12 border-r border-line text-[16px]"
          >
            Don't Allow
          </Pressable>
          <Pressable
            onPress={() => onAnswer("granted")}
            className="press h-12 text-[16px] font-semibold"
          >
            Allow
          </Pressable>
        </View>
      </View>
    </View></Portal>);
}
