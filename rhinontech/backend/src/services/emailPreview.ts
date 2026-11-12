/**
 * The visible text of an email, for list previews and bounce reports.
 *
 * Built from the HTML part whenever there is one. Senders' plain-text parts are
 * often machine-made: ZeroBounce's opened with stray Outlook markup and CSS
 * ("96 .zb-button { border: …"), and that is what the inbox preview showed.
 */

const ENTITIES: Record<string, string> = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", zwnj: "", zwj: "", shy: "",
  ndash: "–", mdash: "—", hellip: "…", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  bull: "•", middot: "·", copy: "©", reg: "®", trade: "™",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] !== "#") return ENTITIES[entity.toLowerCase()] ?? match;
    const code = /^#x/i.test(entity) ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  });
}

// What senders pad a preheader with so the preview stops after their teaser:
// zero-width spaces and joiners, the combining grapheme joiner, soft hyphens,
// direction marks and the byte-order mark.
const INVISIBLE = /[­͏؜ᅟᅠ឴឵᠎​-‏‪-‮⁠-⁤⁪-⁯ㅤ﻿ﾠ]/g;

/** A preview never needs more than this, and some newsletters run to megabytes. */
const MAX_SOURCE = 200_000;

/** HTML to its readable text, line breaks kept where blocks end. */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .slice(0, MAX_SOURCE)
      // Comments include Outlook's <!--[if mso]> blocks, the "96" above.
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(head|style|script|title|noscript|template|xml)\b[\s\S]*?<\/\1\s*>/gi, " ")
      .replace(/<br\s*\/?>|<\/(?:p|div|tr|li|h[1-6]|table|blockquote)\s*>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
  );
}

/** One line of an email's opening text, at most `max` characters. */
export function emailPreview(html?: string | null, text?: string | null, max = 200): string {
  const source = html && /<[a-z!/]/i.test(html) ? htmlToText(html) : html || text || "";
  const line = source
    .replace(INVISIBLE, "")
    // Separator rules ("------", "======") carry no words.
    .replace(/([-_=*~#])\1{3,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return line.length > max ? line.slice(0, max).trimEnd() : line;
}
