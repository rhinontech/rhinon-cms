import { api, getSession } from "./api";
import { ago, defineLive, write } from "./live-core";
import type { Ticket, TicketMsg } from "./mock-more";
import { actions, getState, hydrate } from "./store";

type ApiTicket = { id: string; subject: string; customerName?: string | null; customerEmail?: string | null; status: string; priority: string; assignedUserId: string | null; lastActivityAt: string };
type ApiMsg = { id: string; role: string; text: string; createdAt: string };

const cap = <T extends string>(s: string, ok: readonly T[], fallback: T): T => { const c = (s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()) as T; return ok.includes(c) ? c : fallback; };
const STATUS = ["Open", "Pending", "Resolved"] as const;
const PRIORITY = ["Low", "Medium", "High"] as const;
const who = (id: string | null) => (id && id === getSession()?.userId ? "me" : id);

async function syncTickets() {
  const r = await api<{ tickets: ApiTicket[] }>("/chatbots/tickets").catch(() => ({ tickets: [] as ApiTicket[] }));
  const prev = new Map(getState().tickets.map((t) => [t.id, t]));
  hydrate({
    tickets: r.tickets.map((t): Ticket => ({
      id: t.id, subject: t.subject, from: t.customerName || t.customerEmail || "Visitor", status: cap(t.status, STATUS, "Open"), priority: cap(t.priority, PRIORITY, "Medium"),
      assignee: who(t.assignedUserId), updated: ago(t.lastActivityAt), messages: prev.get(t.id)?.messages ?? [],
    })),
  });
}

export async function loadTicket(id: string) {
  const r = await api<{ messages: ApiMsg[] }>(`/chatbots/tickets/${id}`);
  const messages: TicketMsg[] = r.messages.filter((m) => m.role !== "note").map((m) => ({ id: m.id, who: m.role === "agent" ? "agent" : "customer", text: m.text, at: ago(m.createdAt) }));
  hydrate({ tickets: getState().tickets.map((t) => (t.id === id ? { ...t, messages } : t)) });
}

defineLive({
  name: "chatbot",
  sync: syncTickets,
  blank: () => hydrate({ tickets: [], botChats: [] }),
  install: ({ orig }) => {
    actions.setTicketStatus = (id, status) => { orig.setTicketStatus(id, status); write("chatbot", () => api(`/chatbots/tickets/${id}`, { method: "PATCH", body: { status: status.toLowerCase() } })); };
    actions.assignTicket = (id, whoId) => { orig.assignTicket(id, whoId); write("chatbot", () => api(`/chatbots/tickets/${id}`, { method: "PATCH", body: { assignedUserId: whoId === "me" ? getSession()?.userId : whoId } })); };
    actions.replyTicket = (id, text) => { orig.replyTicket(id, text); write("chatbot", () => api(`/chatbots/tickets/${id}/messages`, { method: "POST", body: { text } }), () => { void loadTicket(id); }); };
  },
});
