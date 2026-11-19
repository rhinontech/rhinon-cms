import { api, getSession } from "./api";
import { ago, defineLive, write } from "./live-core";
import type { BotChat, BotMsg, Ticket, TicketMsg } from "./mock-more";
import { actions, getState, hydrate } from "./store";

// ── Types ────────────────────────────────────────────────────────────────────

type ApiTicket = { id: string; subject: string; customerName?: string | null; customerEmail?: string | null; status: string; priority: string; assignedUserId: string | null; lastActivityAt: string };
type ApiMsg = { id: string; role: string; text: string; createdAt: string };
type ApiConversation = { id: string; visitorId: string; visitorName: string | null; visitorEmail: string | null; mode: string; status: string; lastMessageAt: string | null; lastMessagePreview: string | null; unreadCount: number; title: string | null; isPinned?: boolean; meta?: Record<string, unknown> | null; closedAt?: string | null; createdAt: string; assignedUserId: string | null };
type ApiVisitor = { visitorId: string; name: string | null; email: string | null; pageTitle: string | null; pageUrl: string | null; city: string | null; region: string | null; country: string | null; referrer: string | null; userAgent: string | null; online?: boolean; lastSeenAt?: string | null; conversation: { id: string; mode: string; status: string; unreadCount: number } | null };

// ── Helpers ──────────────────────────────────────────────────────────────────

const cap = <T extends string>(s: string, ok: readonly T[], fallback: T): T => { const c = (s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()) as T; return ok.includes(c) ? c : fallback; };
const STATUS = ["Open", "Pending", "Resolved"] as const;
const PRIORITY = ["Low", "Medium", "High"] as const;
const who = (id: string | null) => (id && id === getSession()?.userId ? "me" : id);

function convToChat(c: ApiConversation): BotChat {
  const modeStatus: BotChat["status"] = c.status === "closed" ? "closed" : c.mode === "human" && c.unreadCount > 0 ? "waiting" : c.mode === "human" ? "agent" : "bot";
  return {
    id: c.id, visitor: c.visitorName || c.visitorEmail || c.title || "Visitor",
    place: "", page: "", source: "", device: "",
    status: modeStatus,
    time: c.lastMessageAt ? ago(c.lastMessageAt) : "",
    preview: c.lastMessagePreview ?? undefined,
    messages: getState().botChats.find((b) => b.id === c.id)?.messages ?? [],
  };
}

// ── Sync ─────────────────────────────────────────────────────────────────────

async function syncChatbot() {
  const [ticketsRes, convsRes] = await Promise.all([
    api<{ tickets: ApiTicket[] }>("/chatbots/tickets").catch(() => ({ tickets: [] as ApiTicket[] })),
    api<{ conversations: ApiConversation[] }>("/chatbots/conversations").catch(() => ({ conversations: [] as ApiConversation[] })),
  ]);

  const prevTickets = new Map(getState().tickets.map((t) => [t.id, t]));
  hydrate({
    tickets: ticketsRes.tickets.map((t): Ticket => ({
      id: t.id, subject: t.subject, from: t.customerName || t.customerEmail || "Visitor",
      status: cap(t.status, STATUS, "Open"), priority: cap(t.priority, PRIORITY, "Medium"),
      assignee: who(t.assignedUserId), updated: ago(t.lastActivityAt),
      messages: prevTickets.get(t.id)?.messages ?? [],
    })),
    botChats: convsRes.conversations.map(convToChat),
  });
}

export async function loadTicket(id: string) {
  const r = await api<{ messages: ApiMsg[] }>(`/chatbots/tickets/${id}`);
  const messages: TicketMsg[] = r.messages.filter((m) => m.role !== "note").map((m) => ({ id: m.id, who: m.role === "agent" ? "agent" : "customer", text: m.text, at: ago(m.createdAt) }));
  hydrate({ tickets: getState().tickets.map((t) => (t.id === id ? { ...t, messages } : t)) });
}

export async function loadConversation(id: string) {
  const r = await api<{ messages: { id: string; role: string; text: string; createdAt: string }[] }>(`/chatbots/conversations/${id}`);
  // roles from backend: "user" (visitor), "bot", "support" (agent), "system" (skip)
  const messages: BotMsg[] = r.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ id: m.id, who: m.role === "support" ? "agent" : m.role === "bot" ? "bot" : "visitor", text: m.text, at: ago(m.createdAt) }));
  hydrate({ botChats: getState().botChats.map((c) => (c.id === id ? { ...c, messages } : c)) });
}

export async function loadVisitors() {
  const r = await api<{ visitors: ApiVisitor[] }>("/chatbots/visitors").catch(() => ({ visitors: [] as ApiVisitor[] }));
  return r.visitors;
}

// ── Live module ───────────────────────────────────────────────────────────────

defineLive({
  name: "chatbot",
  sync: syncChatbot,
  blank: () => hydrate({ tickets: [], botChats: [] }),
  install: ({ orig }) => {
    actions.setTicketStatus = (id, status) => { orig.setTicketStatus(id, status); write("chatbot", () => api(`/chatbots/tickets/${id}`, { method: "PATCH", body: { status: status.toLowerCase() } })); };
    actions.assignTicket = (id, whoId) => { orig.assignTicket(id, whoId); write("chatbot", () => api(`/chatbots/tickets/${id}`, { method: "PATCH", body: { assignedUserId: whoId === "me" ? getSession()?.userId : whoId } })); };
    actions.replyTicket = (id, text) => { orig.replyTicket(id, text); write("chatbot", () => api(`/chatbots/tickets/${id}/messages`, { method: "POST", body: { text } }), () => { void loadTicket(id); }); };
    actions.takeOver = (id) => { orig.takeOver(id); write("chatbot", () => api(`/chatbots/conversations/${id}`, { method: "PATCH", body: { mode: "human", assignedUserId: getSession()?.userId } })); };
    actions.sendBot = (id, text) => { orig.sendBot(id, text); write("chatbot", () => api(`/chatbots/conversations/${id}/messages`, { method: "POST", body: { text } }), () => { void loadConversation(id); }); };
    actions.closeBot = (id) => { orig.closeBot(id); write("chatbot", () => api(`/chatbots/conversations/${id}`, { method: "PATCH", body: { status: "closed" } })); };
  },
});
