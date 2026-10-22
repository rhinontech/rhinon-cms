"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { TbClock, TbExternalLink, TbMapPin, TbMessage, TbMessageCircle, TbUsers, TbWorld } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch } from "@/lib/api";
import { useModuleBase } from "@/lib/sites";
import { cn } from "@/lib/utils";
import { LoadingRows, Notice } from "@/components/Admin/Settings/parts";
import { VisitorsMap, type MappableVisitor } from "@/components/Admin/Analytics/VisitorsMap";
import { Avatar, Chip, EmptyState, PageShell, Panel, Segmented, Stat, StatusDot, pageLabel, since } from "./ui";
import { errorText, openChatForVisitor, useChatEvents } from "./chatbotApi";

interface Visitor {
  visitorId: string;
  name: string | null;
  email: string | null;
  online: boolean;
  since: string;
  lastSeenAt: string;
  pageUrl: string | null;
  pageTitle: string | null;
  referrer: string | null;
  pageViews: number;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  userAgent: string | null;
  conversation: { id: string; mode: "bot" | "human"; status: "open" | "closed"; unreadCount: number } | null;
}

type Filter = "online" | "chatting" | "browsing" | "left";

const label = (v: Visitor) => v.name || v.email || `Visitor ${v.visitorId.slice(-4).toUpperCase()}`;
const place = (v: Visitor) => [v.city, v.country].filter(Boolean).join(", ") || null;
const device = (ua: string | null) => (!ua ? null : /mobile|iphone|android/i.test(ua) ? "Mobile" : /ipad|tablet/i.test(ua) ? "Tablet" : "Desktop");
const source = (ref: string | null) => {
  if (!ref) return "Direct";
  try {
    return new URL(ref).hostname.replace(/^www\./, "");
  } catch {
    return "Direct";
  }
};

export function ChatbotVisitors() {
  const base = useModuleBase();
  const { has } = usePermissions();
  const canAct = has("chatbot:write");
  const [visitors, setVisitors] = useState<Visitor[] | null>(null);
  const [chatbotId, setChatbotId] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("online");
  const [, tick] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ visitors: Visitor[] }>("/chatbots/visitors");
      setVisitors(res.visitors);
      setError(null);
    } catch (err) {
      const message = errorText(err, "Could not load visitors");
      if (/no chatbot/i.test(message)) setMissing(true);
      else setError(message);
    }
  }, []);

  useEffect(() => {
    void load();
    apiFetch<{ chatbot: { id: string } | null }>("/chatbots").then((r) => setChatbotId(r.chatbot?.id ?? null)).catch(() => undefined);
    // Durations ("on site 4 min") tick without refetching.
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, [load]);

  const { connected } = useChatEvents({
    "chat:visitor": (e: { chatbotId: string; visitor: Omit<Visitor, "conversation" | "name"> }) => {
      if (chatbotId && e.chatbotId !== chatbotId) return;
      setVisitors((prev) => {
        if (!prev) return prev;
        const existing = prev.find((v) => v.visitorId === e.visitor.visitorId);
        const merged: Visitor = { ...(existing ?? { name: null, conversation: null }), ...e.visitor } as Visitor;
        const rest = prev.filter((v) => v.visitorId !== merged.visitorId);
        return [merged, ...rest].sort((a, b) => Number(b.online) - Number(a.online) || Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt));
      });
    },
    // A new chat or message changes a visitor's "chatting" state and name.
    "chat:conversation": () => void load(),
  });

  const counts = useMemo(() => {
    const list = visitors ?? [];
    return {
      online: list.filter((v) => v.online).length,
      chatting: list.filter((v) => v.online && v.conversation?.status === "open").length,
      browsing: list.filter((v) => v.online && v.conversation?.status !== "open").length,
      left: list.filter((v) => !v.online).length,
      countries: new Set(list.filter((v) => v.online && v.country).map((v) => v.country)).size,
    };
  }, [visitors]);

  const shown = useMemo(
    () =>
      (visitors ?? []).filter((v) =>
        filter === "online" ? v.online : filter === "chatting" ? v.online && v.conversation?.status === "open" : filter === "browsing" ? v.online && v.conversation?.status !== "open" : !v.online
      ),
    [visitors, filter]
  );

  const points: MappableVisitor[] = useMemo(
    () =>
      shown
        .filter((v) => v.latitude !== null && v.longitude !== null)
        .map((v) => ({
          id: v.visitorId,
          email: v.email,
          city: v.city,
          region: v.region,
          country: v.country,
          location: place(v),
          latitude: v.latitude,
          longitude: v.longitude,
          visitedAt: v.lastSeenAt,
          identified: !!(v.email || v.name),
        })),
    [shown]
  );

  const startChat = (v: Visitor) => {
    if (!chatbotId) return;
    openChatForVisitor(chatbotId, v.visitorId);
    toast.success(`Opened the chat on ${label(v)}'s screen`, { description: "Their reply will appear in Live chats." });
  };

  if (missing) {
    return (
      <PageShell title="Live visitors">
        <Notice tone="info">
          Create the chatbot first. <Link href={base} className="font-medium underline underline-offset-2">Go to Overview →</Link>
        </Notice>
      </PageShell>
    );
  }

  return (
    <PageShell
      width="wide"
      title="Live visitors"
      subtitle="Who's on your website right now, where they're from and what they're reading."
      actions={
        <Chip tone={connected ? "green" : "neutral"}>
          <StatusDot online={connected} className="mr-0.5 size-2" /> {connected ? "Live" : "Reconnecting…"}
        </Chip>
      }
    >
      {error && <Notice tone="danger">{error}</Notice>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="visitor-stats">
        <Stat icon={<TbUsers size={18} />} tone="green" label="On the site now" value={visitors ? counts.online : "—"} />
        <Stat icon={<TbMessageCircle size={18} />} tone="blue" label="Chatting" value={visitors ? counts.chatting : "—"} />
        <Stat icon={<TbWorld size={18} />} tone="violet" label="Countries" value={visitors ? counts.countries : "—"} />
        <Stat icon={<TbClock size={18} />} label="Left in the last 30 min" value={visitors ? counts.left : "—"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <Panel
          padded={false}
          title="Visitors"
          actions={
            <Segmented
              size="sm"
              value={filter}
              onChange={setFilter}
              testIdPrefix="visitors-filter"
              options={[
                { value: "online", label: "Online", count: counts.online },
                { value: "chatting", label: "Chatting", count: counts.chatting },
                { value: "browsing", label: "Browsing", count: counts.browsing },
                { value: "left", label: "Left", count: counts.left },
              ]}
            />
          }
        >
          {!visitors && !error && <div className="p-5"><LoadingRows rows={5} /></div>}
          {visitors && shown.length === 0 && (
            <EmptyState
              icon={<TbUsers size={22} />}
              title={filter === "left" ? "No one has left recently" : "No one here right now"}
              body="Visitors appear the moment they open a page with the chatbot installed, and stay listed for 30 minutes after they leave."
            />
          )}
          <ul className="divide-y divide-border/70" data-testid="visitor-list">
            {shown.map((v) => (
              <li key={v.visitorId} className="flex items-start gap-3 px-5 py-4" data-testid={`visitor-${v.visitorId}`}>
                <div className="relative">
                  <Avatar name={label(v)} seed={v.visitorId} />
                  <StatusDot online={v.online} className="absolute -bottom-0.5 -right-0.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">{label(v)}</span>
                    {v.conversation?.status === "open" &&
                      (v.conversation.mode === "human" ? <Chip tone="blue">With your team</Chip> : <Chip tone="violet">Chatting with the bot</Chip>)}
                    {!v.online && <Chip>Left {since(v.lastSeenAt)} ago</Chip>}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <TbMapPin size={13} /> {place(v) ?? (Date.now() - Date.parse(v.since) < 10_000 ? "Locating…" : "Location unknown")}
                    </span>
                    <span className="inline-flex items-center gap-1"><TbClock size={13} /> {v.online ? `On site ${since(v.since)}` : `Visited ${since(v.since)} ago`}</span>
                    <span>{v.pageViews} page{v.pageViews === 1 ? "" : "s"}</span>
                    {device(v.userAgent) && <span>{device(v.userAgent)}</span>}
                    <span>From {source(v.referrer)}</span>
                  </p>
                  {v.pageUrl && (
                    <a
                      href={v.pageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-foreground/80 hover:text-foreground"
                      title={v.pageUrl}
                    >
                      <span className="truncate">{v.pageTitle || pageLabel(v.pageUrl)}</span>
                      <TbExternalLink size={12} className="shrink-0" />
                    </a>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {v.conversation ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`${base}/chats?c=${v.conversation.id}`}><TbMessage size={14} /> Open chat</Link>
                    </Button>
                  ) : (
                    canAct &&
                    v.online && (
                      <Button size="sm" onClick={() => startChat(v)} data-testid={`start-chat-${v.visitorId}`}>
                        <TbMessageCircle size={14} /> Start chat
                      </Button>
                    )
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel padded={false} title="Where they are" description={points.length ? `${points.length} located` : "Locations appear a moment after visitors arrive."}>
          <div className="p-4">
            <VisitorsMap visitors={points} showSummary={false} />
          </div>
        </Panel>
      </div>
      <p className={cn("text-center text-[11px] text-muted-foreground")}>Locations come from IP addresses and are approximate (usually the city).</p>
    </PageShell>
  );
}
