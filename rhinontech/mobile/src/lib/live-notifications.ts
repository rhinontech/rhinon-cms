import { api } from "./api";
import { ago, defineLive, write } from "./live-core";
import type { Notif } from "./mock-data";
import { actions, hydrate } from "./store";

type ApiNotif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  updatedAt: string;
};

const KIND_MAP: Record<string, Notif["kind"]> = {
  "task.assigned": "task", "task.overdue": "task", "task.due": "task",
  "leave.requested": "approval", "leave.approved": "leave", "leave.rejected": "leave",
  "chat.mention": "chat", "chat.message": "chat",
  "inbox.message": "inbox",
  "payroll.slip": "pay",
  "approval.requested": "approval",
};

function toNotif(n: ApiNotif, now: Date): Notif {
  const kind = KIND_MAP[n.type] ?? "task";
  const at = new Date(n.updatedAt);
  const isToday = at.toDateString() === now.toDateString();
  return {
    id: n.id,
    kind,
    title: n.title,
    body: n.body ?? "",
    time: ago(n.updatedAt),
    unread: !n.readAt,
    to: n.link ?? "/",
    group: isToday ? "Today" : "Earlier",
  };
}

async function syncNotifications() {
  const r = await api<{ items: ApiNotif[]; unread: number }>("/notifications?limit=50").catch(() => null);
  if (!r) return;
  const now = new Date();
  hydrate({ notifs: r.items.map((n) => toNotif(n, now)) });
}

defineLive({
  name: "notifications",
  sync: syncNotifications,
  blank: () => hydrate({ notifs: [] }),
  install: ({ orig }) => {
    actions.readAllNotifs = () => {
      orig.readAllNotifs();
      write("notifications", () => api("/notifications/read-all", { method: "POST" }));
    };
    actions.readNotif = (id: string) => {
      orig.readNotif(id);
      write("notifications", () => api(`/notifications/${id}/read`, { method: "POST" }));
    };
  },
});
