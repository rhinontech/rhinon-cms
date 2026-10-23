import * as cheerio from "cheerio";
import { randomInt } from "node:crypto";
import { ChatbotTicket } from "../../models/ChatbotTicket";
import { HelpArticle } from "../../models/HelpArticle";
import { HelpFolder } from "../../models/HelpFolder";
import { sendAs } from "../emailIdentity";
import type { ConnectedAccount } from "../../models/ConnectedAccount";

/**
 * Tickets and the help center: the pieces both the admin routes and the
 * widget routes need.
 */

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I lookalikes

/** The 8-character id a visitor sees in "Your tickets" (unique across all bots). */
export async function newTicketCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
    if (!(await ChatbotTicket.count({ where: { code } }))) return code;
  }
  throw new Error("Could not allocate a ticket code");
}

/** The widget's "Your tickets" row. */
export function widgetTicket(t: ChatbotTicket) {
  return {
    ticket_id: t.code,
    status: t.status === "resolved" || t.status === "closed" ? "Resolved" : "Open",
    subject: t.subject,
    created_at: t.createdAt,
    updated_at: t.lastActivityAt,
    rating: t.rating,
    // Non-null once someone on the team has picked it up ("Assigned to technical team").
    assigned_user_id: t.assignedUserId ? 1 : null,
  };
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * An agent's reply, emailed to the visitor — from the agent's platform address,
 * or their connected Gmail/Outlook (Settings → Accounts → Tickets, or a one-off
 * pick). Replies come back to the platform address either way. Never throws:
 * the reply is saved regardless and the caller records whether it went out.
 */
export async function emailTicketReply(
  t: ChatbotTicket,
  text: string,
  brandName: string,
  sender: { userId: string; platformFrom: string; account: ConnectedAccount | null }
): Promise<string | null> {
  const subject = `Re: ${t.subject} [#${t.code}]`;
  const html = `<div style="font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.6;color:#111827">${escapeHtml(text).replace(/\n/g, "<br>")}
<p style="margin-top:28px;color:#6b7280;font-size:13px">— ${escapeHtml(brandName)} support · Ticket #${t.code}</p></div>`;
  try {
    const { from } = await sendAs(
      sender.userId,
      "tickets",
      {
        to: t.customerEmail,
        platformFrom: sender.platformFrom,
        fromName: sender.account?.name || brandName,
        subject,
        html,
        text: `${text}\n\n—\n${brandName} support · Ticket #${t.code}`,
      },
      sender.account
    );
    return from;
  } catch (err: any) {
    console.error(`[Tickets] reply email failed${sender.account ? ` (${sender.account.provider})` : ""}:`, err?.message || err);
    return null;
  }
}

// ── Help center ────────────────────────────────────────────────────────

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "h2", "h3", "h4",
  "blockquote", "code", "pre", "hr", "img", "table", "thead", "tbody", "tr", "th", "td", "span", "div",
]);
const ALLOWED_ATTRS: Record<string, string[]> = { a: ["href"], img: ["src", "alt"] };

/**
 * Articles are shown on customers' public sites as HTML, so only a small set
 * of formatting tags survives: no scripts, styles, handlers or iframes, and
 * links/images must be http(s) (links may also be mailto:/tel:).
 */
export function cleanArticleHtml(html: unknown): string {
  if (typeof html !== "string" || !html.trim()) return "";
  const $ = cheerio.load(html.slice(0, 200_000), null, false);
  $("script,style,iframe,object,embed,form,input,button,textarea,select,link,meta").remove();
  $("*").each((_, el) => {
    if (el.type !== "tag") return;
    const tag = el.name.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      $(el).replaceWith($(el).contents());
      return;
    }
    const keep = ALLOWED_ATTRS[tag] ?? [];
    for (const name of Object.keys(el.attribs)) {
      if (!keep.includes(name)) $(el).removeAttr(name);
    }
    if (tag === "a") {
      const href = (el.attribs.href ?? "").trim();
      if (!/^(https?:\/\/|mailto:|tel:|\/)/i.test(href)) $(el).removeAttr("href");
      else $(el).attr({ target: "_blank", rel: "noopener noreferrer" });
    }
    if (tag === "img" && !/^https?:\/\//i.test((el.attribs.src ?? "").trim())) $(el).remove();
  });
  return $.html();
}

/** Published articles grouped by folder, in the widget's shape. Empty folders are left out. */
export async function widgetHelpStructure(chatbotId: string) {
  const [folders, articles] = await Promise.all([
    HelpFolder.findAll({ where: { chatbotId }, order: [["position", "ASC"], ["createdAt", "ASC"]] }),
    HelpArticle.findAll({
      where: { chatbotId, status: "published" },
      attributes: { exclude: ["content"] },
      order: [["position", "ASC"], ["createdAt", "ASC"]],
    }),
  ]);
  return folders
    .map((f) => ({
      folderId: f.id,
      name: f.name,
      description: f.description,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      articles: articles.filter((a) => a.folderId === f.id).map((a) => widgetArticle(a)),
    }))
    .filter((f) => f.articles.length);
}

export function widgetArticle(a: HelpArticle) {
  return {
    articleId: a.id,
    title: a.title,
    content: a.content ?? "",
    status: a.status,
    views: a.views,
    likes: a.likes,
    dislikes: a.dislikes,
    createdAt: a.createdAt,
    updated_at: a.updatedAt,
  };
}

/** Next position at the end of a list. */
export async function nextPosition(model: typeof HelpFolder | typeof HelpArticle, where: Record<string, unknown>) {
  const max = (await (model as any).max("position", { where })) as number | null;
  return (max ?? -1) + 1;
}
