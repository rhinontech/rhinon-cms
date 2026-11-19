import { api } from "./api";
import { ago, defineLive, startOfDay, write, WEEKDAYS, MONTHS, hhmm } from "./live-core";
import type { Message, Thread } from "./mock-data";
import { actions, getState, hydrate } from "./store";

type ApiMail = {
  id: string; threadKey: string; folder: string; fromName: string; fromEmail: string; subject: string; snippet: string; body?: string;
  isRead: boolean; isStarred: boolean; hasAttachment: boolean; sentAt: string; fromMe?: boolean; campaign?: { name: string } | null;
  attachments?: { name: string; size: number; mimeType: string }[];
};

const dayOf = (iso: string) => {
  const d = new Date(iso), today = startOfDay(new Date());
  const diff = Math.round((today - startOfDay(d)) / 86_400_000);
  return diff === 0 ? "Today" : diff === 1 ? "Yesterday" : diff < 7 ? WEEKDAYS[d.getDay()]! : `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

const FOLDER: Record<string, Thread["folder"]> = { inbox: "inbox", sent: "sent", archive: "archive" };

/** One row per thread: the newest message stands for it; opening it loads the whole conversation. */
async function syncInbox() {
  const brand = getState().brand;
  const folders = ["inbox", "sent", "archive"] as const;
  const lists = await Promise.all(folders.map((f) => api<ApiMail[]>(`/inbox?folder=${f}&limit=60`).catch(() => [] as ApiMail[])));
  const threads: Thread[] = [];
  lists.forEach((rows, fi) => {
    const seen = new Set<string>();
    for (const m of rows) {
      if (seen.has(m.threadKey)) continue;
      seen.add(m.threadKey);
      threads.push({
        id: m.id, brand, folder: FOLDER[folders[fi]!]!, starred: m.isStarred, unread: !m.isRead, subject: m.subject || "(no subject)",
        labels: m.campaign ? [{ text: m.campaign.name, tone: "violet" }] : [], attachment: m.hasAttachment, day: dayOf(m.sentAt), time: hhmm(m.sentAt),
        messages: [{ id: m.id, from: m.fromName || m.fromEmail, email: m.fromEmail, at: `${dayOf(m.sentAt)} ${hhmm(m.sentAt)}`, body: m.snippet || "" }],
      });
    }
  });
  hydrate({ threads });
}

export async function loadThread(id: string) {
  const r = await api<ApiMail & { thread: ApiMail[] }>(`/inbox/${id}`);
  const messages: Message[] = r.thread.map((m) => ({
    id: m.id, from: m.fromName || m.fromEmail, email: m.fromEmail, at: `${dayOf(m.sentAt)} ${hhmm(m.sentAt)}`, body: m.body ?? m.snippet, ...(m.fromMe ? { mine: true } : {}),
  }));
  hydrate({ threads: getState().threads.map((t) => (t.id === id ? { ...t, unread: false, messages } : t)) });
}

defineLive({
  name: "inbox",
  sync: syncInbox,
  blank: () => hydrate({ threads: [] }),
  install: ({ orig }) => {
    actions.markRead = (id) => { orig.markRead(id); write("inbox", () => api(`/inbox/${id}`, { method: "PATCH", body: { isRead: true } })); };
    actions.toggleStar = (id) => {
      orig.toggleStar(id);
      const t = getState().threads.find((x) => x.id === id);
      if (t) write("inbox", () => api(`/inbox/${id}`, { method: "PATCH", body: { isStarred: t.starred } }));
    };
    actions.archive = (id) => { orig.archive(id); write("inbox", () => api(`/inbox/${id}`, { method: "PATCH", body: { folder: "archive" } })); };
    actions.reply = (id, text, files) => {
      orig.reply(id, text, files);
      write("inbox", () => api(`/inbox/${id}/reply`, { method: "POST", body: { body: text } }), () => { void loadThread(id); });
    };
    actions.compose = (to, subject, body, files) => {
      orig.compose(to, subject, body, files);
      write("inbox", () => api("/inbox", { method: "POST", body: { toEmails: to.split(/[,;\s]+/).filter(Boolean), subject, body, folder: "sent" } }));
    };
  },
});
void ago;
