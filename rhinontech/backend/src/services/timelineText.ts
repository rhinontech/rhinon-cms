/**
 * What a campaign activity's stored draft says, as text a person can read on a CRM timeline.
 *
 * `campaign_activities.generatedContent` holds whatever the engine produced at the time, and that has
 * been three different things: an HTML email (mail-merge drafts and inbound replies), a JSON object
 * from the sales agent, and plain text. The timeline used to hand all of it to the screen untouched, so
 * people read `<p>Hi Phil,</p><p>We've just launched…` and `{"prospectSummary":{"name":…`.
 */
import { htmlToText } from "./emailPreview";

/** Zero-width and soft-hyphen padding that senders add to emails; invisible on screen, noise in text. */
const INVISIBLE = /[­͏؜ᅟᅠ឴឵᠎​-‏‪-‮⁠-⁤⁪-⁯ㅤ﻿ﾠ]/g;

const looksLikeHtml = (s: string) => /<[a-z!/][^>]*>/i.test(s);

/** Collapses runs of spaces and blank lines but keeps paragraph breaks. */
function tidy(text: string): string {
  return text
    .replace(INVISIBLE, "")
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const asText = (s: string) => tidy(looksLikeHtml(s) ? htmlToText(s) : s);

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/** One line about a prospect, from either of the shapes the sales agent has used. */
function describeProspect(v: unknown): string | null {
  if (typeof v === "string") return str(v);
  if (v && typeof v === "object") {
    const p = v as Record<string, unknown>;
    const who = [str(p.name), [str(p.title), str(p.company)].filter(Boolean).join(" at ")].filter(Boolean).join(", ");
    const extra = [str(p.industry), str(p.companySize)].filter(Boolean).join(" · ");
    return [who, extra].filter(Boolean).join(" (") + (who && extra ? ")" : "") || null;
  }
  return null;
}

/** The sales agent's JSON: the email it drafted if there is one, else what it learned about the prospect. */
function fromAgentJson(o: Record<string, unknown>): string | null {
  const subject = str(o.subject);
  const body = str(o.body);
  if (subject || body) return [subject && `Subject: ${subject}`, body && asText(body)].filter(Boolean).join("\n\n");

  const lines = [
    ["Prospect", describeProspect(o.prospectSummary)],
    ["Company", str(o.companyDescription)],
    ["Likely pain", str(o.likelyPain) ?? str(o.potentialPainPoint)],
    ["Recent news", str(o.recentNews)],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`);
  return lines.length ? lines.join("\n") : null;
}

/**
 * Readable text for the timeline, or null when there is nothing worth showing.
 * `max` keeps the payload small; the screen clamps what it displays further.
 */
export function readableDraft(raw: string | null | undefined, max = 600): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;

  let text: string | null;
  if (s[0] === "{" || s[0] === "[") {
    try {
      const parsed = JSON.parse(s);
      // JSON that is not a draft we recognise is better left out than dumped on the screen.
      text = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? fromAgentJson(parsed as Record<string, unknown>) : null;
    } catch {
      text = asText(s); // cut off mid-way, so not JSON any more: show what is there
    }
  } else {
    text = asText(s);
  }

  if (!text) return null;
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
