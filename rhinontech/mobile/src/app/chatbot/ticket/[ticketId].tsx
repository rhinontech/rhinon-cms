import { loadTicket, useLoad } from "@/lib/live";
import { useRev } from "@/lib/store";
import { View, Text, Span, Pressable, TextInput } from "@/components/rn";
import { useLocalSearchParams } from "expo-router";
import { Check, Send } from "@/components/icons";
import { useState } from "react";
import {
  Avatar,
  Badge,
  Chip,
  Display,
  Empty,
  Eyebrow,
  Screen,
  TopBar,
  inputClass,
} from "@/components/rhinon/ui";
import { nameOf } from "@/lib/mock-data";
import type { Ticket } from "@/lib/mock-more";
import { actions, useApp } from "@/lib/store";
import { TONES, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";
const STATUSES: Ticket["status"][] = ["Open", "Pending", "Resolved"];
const PRIORITY_TONE: Record<Ticket["priority"], Tone> = {
  High: "coral",
  Medium: "sun",
  Low: "sky",
};
export default function TicketPage() {
  useRev();
  const { ticketId } = useLocalSearchParams<{
    ticketId: string;
  }>();
  useLoad(loadTicket, ticketId);
  const ticket = useApp((s) => s.tickets.find((t) => t.id === ticketId));
  const [reply, setReply] = useState("");
  if (!ticket) {
    return (
      <Screen>
        <TopBar title="Ticket" fallback="/chatbot" />
        <Empty
          title="Ticket not found"
          body="It may have been merged into another ticket."
          tone="sky"
        />
      </Screen>
    );
  }
  const send = () => {
    if (!reply.trim()) return;
    actions.replyTicket(ticket.id, reply.trim());
    setReply("");
  };
  return (
    <Screen>
      <TopBar title="Ticket" fallback="/chatbot" />
      <Eyebrow tone="sky">
        {ticket.from} · {ticket.updated}
      </Eyebrow>
      <Display size="xl" className="mt-2">
        {ticket.subject}
      </Display>

      <View className="mt-5 flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <Chip
            key={s}
            tone={s === "Resolved" ? "leaf" : s === "Open" ? "coral" : "sun"}
            active={ticket.status === s}
            onClick={() => actions.setTicketStatus(ticket.id, s)}
          >
            {ticket.status === s && s === "Resolved" ? <Check size={13} strokeWidth={3} /> : null}
            {s}
          </Chip>
        ))}
      </View>
      <View className="mt-3 flex items-center gap-3">
        <Badge tone={PRIORITY_TONE[ticket.priority]}>{ticket.priority} priority</Badge>
        <Pressable
          onPress={() => actions.assignTicket(ticket.id, ticket.assignee === "me" ? null : "me")}
          className="press inline-flex h-9 items-center gap-2 rounded-full border border-ink/20 px-3.5 text-[13px] font-medium"
        >
          {ticket.assignee ? <Avatar name={nameOf(ticket.assignee)} size={22} /> : null}
          {ticket.assignee
            ? ticket.assignee === "me"
              ? "Assigned to you"
              : `Assigned to ${nameOf(ticket.assignee).split(" ")[0]}`
            : "Assign to me"}
        </Pressable>
      </View>

      <View className="mt-6 space-y-3">
        {ticket.messages.map((m) => (
          <View
            key={m.id}
            className={cn(
              "rounded-3xl p-4",
              m.who === "agent" ? "bg-paper-deep" : "border border-line/70 bg-card",
            )}
          >
            <View className="flex items-center justify-between gap-3">
              <Text
                className={cn(
                  "font-mono text-[10.5px] font-medium uppercase tracking-[0.14em]",
                  m.who === "agent" ? TONES.sky.text : "text-ink/60",
                )}
              >
                {m.who === "agent" ? "Rhinon support" : ticket.from}
              </Text>
              <Span className="font-mono text-[10px] text-ink/40">{m.at}</Span>
            </View>
            <Text className="mt-2 text-[15.5px] leading-relaxed">{m.text}</Text>
          </View>
        ))}
      </View>

      <View className="sticky bottom-0 z-20 -mx-5 mt-auto flex items-end gap-2 bg-gradient-to-t from-paper from-70% to-transparent px-5 pb-1 pt-8">
        <TextInput
          rows={1}
          className={cn(inputClass, "resize-none rounded-3xl py-3.5 pl-5")}
          placeholder="Reply to the customer…"
          value={reply}
          onChangeText={(text) => setReply(text)}
        />
        <Pressable
          accessibilityLabel="Send reply"
          onPress={send}
          disabled={!reply.trim()}
          className="press grid size-[52px] shrink-0 place-items-center rounded-full bg-sky text-sky-foreground disabled:opacity-30"
        >
          <Send size={20} strokeWidth={2.2} />
        </Pressable>
      </View>
    </Screen>
  );
}
