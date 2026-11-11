import { api, getSession } from "./api";
import { ago, defineLive, startOfDay, toneAt, write } from "./live-core";
import { PEOPLE, type Chat, type Notif } from "./mock-data";
import { actions, getState, hydrate } from "./store";

type ApiConv = { id: string; kind: string; name: string | null; memberIds: string[]; unread: number; pinned: boolean; lastMessage: { body: string; authorId: string; createdAt: string } | null; lastMessageAt: string | null };
type ApiMsg = { id: string; authorId: string; body: string; createdAt: string };

const nameOf = (id: string, me: string, fallback = "Teammate") => (id === me ? "me" : (PEOPLE.find((p) => p.id === id)?.name ?? fallback));

async function syncChat() {
  const me = getSession()?.userId ?? "";
  const convs = await api<ApiConv[]>("/team-chat/conversations");
  hydrate({
    chats: convs.map((c, i): Chat => {
      const dm = c.kind === "direct";
      const other = c.memberIds.find((m) => m !== me) ?? me;
      return {
        id: c.id, kind: dm ? "dm" : c.kind === "channel" ? "channel" : "group", name: dm ? nameOf(other, me) : (c.name ?? "Untitled"),
        tone: toneAt(i), members: c.memberIds.map((m) => (m === me ? "me" : m)), unread: c.unread, time: ago(c.lastMessageAt), pinned: c.pinned,
        messages: c.lastMessage ? [{ id: "last", from: nameOf(c.lastMessage.authorId, me), text: c.lastMessage.body, at: ago(c.lastMessage.createdAt) }] : [],
      };
    }),
  });
}

export async function loadChatMessages(id: string) {
  const me = getSession()?.userId ?? "";
  const res = await api<{ messages?: ApiMsg[] } | ApiMsg[]>(`/team-chat/conversations/${id}/messages`);
  const rows = Array.isArray(res) ? res : (res.messages ?? []);
  // the API may return newest-first; the thread is shown oldest-first
  const ordered = [...rows].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const msgs = ordered.map((m) => ({ id: m.id, from: m.authorId === me ? "me" : nameOf(m.authorId, me), text: m.body, at: ago(m.createdAt) }));
  hydrate({ chats: getState().chats.map((c) => (c.id === id ? { ...c, messages: msgs, unread: 0 } : c)) });
  await api(`/team-chat/conversations/${id}/read`, { method: "POST" }).catch(() => {});
}

type ApiNotif = { id: string; type: string; title: string; body: string | null; link: string | null; readAt: string | null; updatedAt: string };
const KIND: Record<string, Notif["kind"]> = { task: "task", leave: "leave", chat: "chat", inbox: "inbox", pay: "pay", payroll: "pay", approval: "approval", reimbursement: "approval", attendance: "approval" };

async function syncNotifications() {
  const r = await api<{ items: ApiNotif[] }>("/notifications?limit=50");
  const startToday = startOfDay(new Date());
  hydrate({
    notifs: r.items.map((n): Notif => ({
      id: n.id, kind: KIND[n.type.split(".")[0]!] ?? "task", title: n.title, body: n.body ?? "", time: ago(n.updatedAt),
      unread: !n.readAt, to: n.link ?? "", group: new Date(n.updatedAt).getTime() >= startToday ? "Today" : "Earlier",
    })),
  });
}

defineLive({
  name: "chat",
  sync: syncChat,
  blank: () => hydrate({ chats: [] }),
  install: ({ orig }) => {
    actions.sendChat = (id, text, attachment) => {
      orig.sendChat(id, text, attachment);
      write("chat", () => api(`/team-chat/conversations/${id}/messages`, { method: "POST", body: { body: text } }), () => { void loadChatMessages(id); });
    };
    actions.markChatRead = () => undefined;
    actions.startDm = (personId) => {
      const id = orig.startDm(personId);
      // the real conversation is created server-side; the screen opens the optimistic one until the next sync
      void api<{ id: string }>("/team-chat/conversations", { method: "POST", body: { kind: "direct", memberIds: [personId] } }).then(() => syncChat()).catch(() => {});
      return id;
    };
  },
});

defineLive({
  name: "notifications",
  sync: syncNotifications,
  blank: () => hydrate({ notifs: [] }),
  install: ({ orig }) => {
    actions.readNotif = (id) => { orig.readNotif(id); write("notifications", () => api(`/notifications/${id}/read`, { method: "POST" })); };
    actions.readAllNotifs = () => { orig.readAllNotifs(); write("notifications", () => api("/notifications/read-all", { method: "POST" })); };
  },
});
