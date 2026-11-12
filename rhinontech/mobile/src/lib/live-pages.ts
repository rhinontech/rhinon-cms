import { api, getSession } from "./api";
import { ago, defineLive, toneAt, write } from "./live-core";
import type { WikiIcon, WikiPage } from "./mock-more";
import { actions, getState, hydrate } from "./store";
import { fromMarkdown, toMarkdown } from "./tiptap-md";

type ApiPage = { id: string; title: string; icon: string | null; parentId: string | null; ownerId: string; visibility: string; updatedAt?: string };
type ApiPageFull = ApiPage & { content: { type: string; content?: unknown[] } | null; shares?: { userId: string }[]; updatedAt: string };

const ICONS: [RegExp, WikiIcon][] = [[/rocket|🚀/i, "rocket"], [/palette|design|🎨/i, "palette"], [/megaphone|market|📣/i, "megaphone"], [/users|team|people|👥/i, "users"], [/shield|secur|🛡/i, "shield"]];
const iconOf = (i: string | null): WikiIcon => ICONS.find(([re]) => i && re.test(i))?.[1] ?? "book";
const meId = () => getSession()?.userId ?? "";
const who = (id: string) => (id === meId() ? "me" : id);

async function syncPages() {
  const rows = await api<ApiPage[]>("/pages/tree").catch(() => [] as ApiPage[]);
  const prev = new Map(getState().pages.map((p) => [p.id, p]));
  hydrate({
    pages: rows.map((p, i): WikiPage => ({
      id: p.id, title: p.title, icon: iconOf(p.icon), tone: toneAt(i + 3), parent: p.parentId, updated: prev.get(p.id)?.updated ?? "", by: who(p.ownerId),
      body: prev.get(p.id)?.body ?? "", sharedWith: prev.get(p.id)?.sharedWith ?? [], linkShare: p.visibility === "link",
    })),
  });
}

/** Load one page's body (and who it is shared with) when it is opened. */
export async function loadPage(id: string) {
  const p = await api<ApiPageFull>(`/pages/${id}`);
  hydrate({ pages: getState().pages.map((x) => (x.id === id ? { ...x, body: toMarkdown(p.content as never), updated: ago(p.updatedAt) || "Today", sharedWith: (p.shares ?? []).map((s) => who(s.userId)), linkShare: p.visibility === "link" } : x)) });
}

/** Create a page on the server and return its real id (the sheet opens the page after this resolves). */
export async function createPageRemote(title: string, parent: string | null): Promise<string> {
  const p = await api<{ id: string }>("/pages", { method: "POST", body: { title: title || "Untitled", parentId: parent } });
  await syncPages();
  return p.id;
}

defineLive({
  name: "pages",
  sync: syncPages,
  blank: () => hydrate({ pages: [] }),
  install: ({ orig }) => {
    const save = (id: string, title: string | null, body: string) => {
      const content = fromMarkdown(body);
      write("pages", () => api(`/pages/${id}`, { method: "PUT", body: { ...(title !== null ? { title } : null), content } }));
    };
    actions.savePage = (id, title, body) => { orig.savePage(id, title, body); save(id, title, body); };
    actions.setPageBody = (id, body) => { orig.setPageBody(id, body); save(id, null, body); };
    actions.sharePage = (id, sharedWith, linkShare) => {
      orig.sharePage(id, sharedWith, linkShare);
      write("pages", () => api(`/pages/${id}/shares`, { method: "PUT", body: { shares: sharedWith.filter((u) => u !== "me").map((userId) => ({ userId, access: "view" })), visibility: linkShare ? "link" : undefined } }));
    };
  },
});
