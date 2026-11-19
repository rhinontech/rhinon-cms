import { useRev } from "@/lib/store";
import { View, Text, Span, Link } from "@/components/rn";
import { ChevronRight } from "@/components/icons";
import { useState, useEffect } from "react";
import { VisitorMap } from "@/components/rhinon/charts";
import {
  Avatar,
  Badge,
  Chip,
  Display,
  Empty,
  Eyebrow,
  NoAccess,
  Screen,
  Segmented,
  TopBar,
  stagger,
} from "@/components/rhinon/ui";
import { type BotChat, type Ticket } from "@/lib/mock-more";
import { nameOf } from "@/lib/mock-data";
import { useApp, usePerm } from "@/lib/store";
import { loadVisitors } from "@/lib/live-chatbot";
import { TONES, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";

type Tab = "live" | "tickets" | "visitors";
type ApiVisitor = Awaited<ReturnType<typeof loadVisitors>>[number];
const STATUS: Record<
  BotChat["status"],
  {
    label: string;
    tone: Tone;
  }
> = {
  waiting: {
    label: "Needs you",
    tone: "coral",
  },
  bot: {
    label: "Bot",
    tone: "sky",
  },
  agent: {
    label: "You",
    tone: "leaf",
  },
  closed: {
    label: "Closed",
    tone: "ink",
  },
};
const PRIORITY_TONE: Record<Ticket["priority"], Tone> = {
  High: "coral",
  Medium: "sun",
  Low: "sky",
};
const TICKET_TONE: Record<Ticket["status"], Tone> = {
  Open: "coral",
  Pending: "sun",
  Resolved: "leaf",
};
const ORDER: BotChat["status"][] = ["waiting", "agent", "bot", "closed"];
export default function ChatbotPage() {
  useRev();
  const chats = useApp((s) => s.botChats);
  const tickets = useApp((s) => s.tickets);
  const allowed = usePerm("chatbot");
  const [tab, setTab] = useState<Tab>("live");
  const [filter, setFilter] = useState<"All" | Ticket["status"]>("All");
  const [visitors, setVisitors] = useState<ApiVisitor[]>([]);

  useEffect(() => {
    if (tab === "visitors" && allowed) {
      loadVisitors().then(setVisitors).catch(() => setVisitors([]));
    }
  }, [tab, allowed]);
  if (!allowed) {
    return (
      <Screen>
        <TopBar title="Chatbot" fallback="/more" />
        <NoAccess
          title="No Chatbot access"
          body="Live chats and tickets are limited to admins. Ask an admin to grant chatbot:read."
        />
      </Screen>
    );
  }
  const waiting = chats.filter((c) => c.status === "waiting").length;
  const rows = [...chats].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  const tix = tickets.filter((t) => filter === "All" || t.status === filter);
  return (
    <Screen>
      <TopBar title="Chatbot" fallback="/more" />
      <View className="animate-rise">
        <Eyebrow tone="sky">{waiting} waiting for a person</Eyebrow>
        <Display size="hero" className="mt-3">
          Hand it
          {"\n"}
          over.
        </Display>
      </View>

      <Segmented
        className="mt-6"
        value={tab}
        onChange={setTab}
        options={[
          {
            value: "live",
            label: "Live",
            badge: waiting || undefined,
          },
          {
            value: "tickets",
            label: "Tickets",
          },
          {
            value: "visitors",
            label: "On site",
          },
        ]}
      />

      {tab === "live" ? (
        <View className="mt-3">
          {rows.map((c, i) => {
            const last = c.messages.at(-1);
            const st = STATUS[c.status];
            return (
              <View
                key={c.id}
                className="press relative animate-rise border-b border-line/70 last:border-0"
                style={stagger(Math.min(i, 6))}
              >
                <Link
                  to="/chatbot/chat/$chatId"
                  params={{
                    chatId: c.id,
                  }}
                  aria-label={`${c.visitor}, ${st.label}`}
                  className="absolute inset-0 z-0"
                />
                <View className="pointer-events-none relative z-10 flex items-center gap-3.5 py-3.5">
                  <Avatar name={c.visitor} size={50} />
                  <View className="min-w-0 flex-1">
                    <View className="flex items-baseline justify-between gap-2">
                      <Text className="truncate text-[16px] font-semibold">{c.visitor}</Text>
                      <View className="shrink-0 font-mono text-[10.5px] text-ink/45">{c.time}</View>
                    </View>
                    <Text className="truncate text-[13px] text-ink/55">
                      {c.place} · {c.page}
                    </Text>
                    <Text className="mt-0.5 truncate text-[14px] text-ink/70">{last?.text}</Text>
                  </View>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {tab === "tickets" ? (
        <View className="mt-4">
          <View className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {(["All", "Open", "Pending", "Resolved"] as const).map((f) => (
              <Chip key={f} tone="sky" active={filter === f} onClick={() => setFilter(f)}>
                {f}
              </Chip>
            ))}
          </View>
          {tix.length === 0 ? (
            <Empty tone="sky" title="No tickets" body="Nothing matches this filter." />
          ) : (
            <View className="mt-3 space-y-2.5">
              {tix.map((t, i) => (
                <View
                  key={t.id}
                  className="press relative animate-rise rounded-2xl border border-line/70 bg-card p-4"
                  style={stagger(Math.min(i, 6))}
                >
                  <Link
                    to="/chatbot/ticket/$ticketId"
                    params={{
                      ticketId: t.id,
                    }}
                    aria-label={t.subject}
                    className="absolute inset-0 z-0 rounded-2xl"
                  />
                  <View className="pointer-events-none relative z-10">
                    <View className="flex items-start justify-between gap-3">
                      <Text className="text-[16px] font-semibold leading-snug">{t.subject}</Text>
                      <ChevronRight size={18} className="mt-1 shrink-0 text-ink/30" />
                    </View>
                    <Text className="mt-1 text-[13px] text-ink/55">
                      {t.from} · {t.updated}
                    </Text>
                    <View className="mt-3 flex items-center gap-2">
                      <Badge tone={TICKET_TONE[t.status]}>{t.status}</Badge>
                      <View className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/55">
                        <View
                          className={cn(
                            "size-2 rounded-full",
                            TONES[PRIORITY_TONE[t.priority]].dot,
                          )}
                        />
                        {t.priority}
                      </View>
                      <Span className="ml-auto">
                        {t.assignee ? (
                          <Avatar name={nameOf(t.assignee)} size={26} />
                        ) : (
                          <Span className="font-mono text-[10px] uppercase tracking-[0.1em] text-coral-deep">
                            Unassigned
                          </Span>
                        )}
                      </Span>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : null}

      {tab === "visitors" ? (
        <View className="mt-5">
          <View className="mb-4 flex items-end justify-between">
            <Text className="font-display text-[length:calc(72px*var(--ds))] leading-[0.8]">
              {visitors.length}
            </Text>
            <Text className="pb-1 text-right font-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-ink/60">
              on the site{"\n"}right now
            </Text>
          </View>
          {visitors.length === 0 ? (
            <Empty title="No one on site" body="Visitors appear here when they open the widget." tone="sky" />
          ) : (
            <View className="mt-3">
              {visitors.map((v) => {
                const displayName = v.name || v.email || "Anonymous";
                const chatting = !!v.conversation;
                return (
                  <View
                    key={v.visitorId}
                    className="flex items-center gap-3 border-b border-line/70 py-3 last:border-0"
                  >
                    <Avatar name={displayName} size={40} />
                    <View className="min-w-0 flex-1">
                      <Text className="truncate font-semibold leading-tight">{displayName}</Text>
                      <Text className="truncate text-[13px] text-ink/55">
                        {[v.city || v.country, v.pageTitle || v.pageUrl].filter(Boolean).join(" · ")}
                      </Text>
                    </View>
                    <View className="text-right">
                      {v.referrer ? <Text className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/55">{v.referrer}</Text> : null}
                      <Badge tone={chatting ? (v.conversation!.unreadCount > 0 ? "coral" : "leaf") : "sky"}>
                        {chatting ? (v.conversation!.unreadCount > 0 ? "Waiting" : "Chatting") : "Browsing"}
                      </Badge>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      ) : null}
    </Screen>
  );
}
