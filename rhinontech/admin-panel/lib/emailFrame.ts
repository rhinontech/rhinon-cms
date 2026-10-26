/**
 * Turns an email body into a self-contained document for a sandboxed iframe.
 *
 * The sandbox already blocks scripts, forms and navigation. The same things
 * are stripped from the markup too, so nothing executable is left even where
 * a browser ignores the CSP. Links open in a new tab. A base stylesheet goes
 * in ahead of the sender's own, so their styles win wherever they set any.
 */

export interface EmailPalette {
  /** Text colour around the frame, for plain messages. */
  text: string;
  /** Quoted replies and rules in plain messages. */
  muted: string;
  link: string;
  /** The app's font, plus the @font-face rules it needs inside the frame. */
  fontFamily: string;
  fontFaces: string;
  dark: boolean;
}

export interface EmailDocument {
  srcDoc: string;
  /** Laid out by its sender (own colours, tables or stylesheet), so shown on white. */
  designed: boolean;
}

// Anything that executes, embeds another document or navigates on its own.
const STRIP =
  "script, noscript, iframe, frame, frameset, object, embed, applet, base, meta[http-equiv], link[rel='import'], link[rel='preload'], link[rel='prefetch']";
// Signs that a sender styled the message, so it keeps its own (light) canvas.
const DESIGNED = "style, table, [bgcolor], [background], font[color], [style*='color'], [style*='background']";
const UNSAFE_URL = /^\s*(?:javascript|vbscript|data:text\/html)/i;
const CSP =
  "default-src * data: blob: 'unsafe-inline'; script-src 'none'; object-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'";

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Plain-text mail (replies typed in the composer) keeps its line breaks and gets live links. */
function textToHtml(text: string): string {
  const linked = escapeHtml(text).replace(/\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)\]'"]/g, (url) => `<a href="${url}">${url}</a>`);
  return `<div style="white-space:pre-wrap">${linked}</div>`;
}

function baseStyles(palette: EmailPalette, designed: boolean): string {
  const common = `
:root { color-scheme: ${designed || !palette.dark ? "light" : "dark"}; }
html { overflow-x: auto; overflow-y: hidden; }
html, body { margin: 0; padding: 0; }
body { overflow-wrap: break-word; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
img { max-width: 100%; }
img:not([height]) { height: auto; }
pre { white-space: pre-wrap; }`;
  if (designed) {
    return `${common}
body { background: #ffffff; color: #1f2328; font: 14px/1.5 Arial, Helvetica, sans-serif; }
a { color: #1a5fd0; }`;
  }
  return `${palette.fontFaces}
${common}
body { background: transparent; color: ${palette.text}; font: 14px/1.65 ${palette.fontFamily}; }
a { color: ${palette.link}; text-underline-offset: 2px; }
p { margin: 0 0 0.75em; }
p:last-child { margin-bottom: 0; }
blockquote { margin: 0.75em 0; padding: 0 0 0 0.9em; border-left: 2px solid color-mix(in oklch, ${palette.text} 18%, transparent); color: ${palette.muted}; }
hr { border: 0; border-top: 1px solid color-mix(in oklch, ${palette.text} 14%, transparent); margin: 1em 0; }`;
}

const isBlank = (node: ChildNode): boolean => {
  if (node.nodeType === Node.COMMENT_NODE) return true;
  if (node.nodeType === Node.TEXT_NODE) return !node.textContent?.replace(/ /g, " ").trim();
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  const el = node as Element;
  if (el.matches("br")) return true;
  if (el.matches("img, hr, table, video") || el.querySelector("img, hr, table, video")) return false;
  return !el.textContent?.replace(/ /g, " ").trim();
};

/**
 * Drops the empty lines mail clients pad a message with (Gmail opens every
 * message with <div><br clear="all"></div>), descending through the wrapper
 * divs they nest the text in.
 */
function trimBlankEdges(body: HTMLElement) {
  for (const edge of ["firstChild", "lastChild"] as const) {
    let parent: Element | null = body;
    while (parent) {
      let node: ChildNode | null = parent[edge];
      while (node && isBlank(node)) {
        const next: ChildNode | null = edge === "firstChild" ? node.nextSibling : node.previousSibling;
        node.remove();
        node = next;
      }
      parent = node instanceof Element && node.matches("div, p, span, section") ? node : null;
    }
  }
}

export function buildEmailDocument(body: string, palette: EmailPalette): EmailDocument {
  const html = /<[a-z!/][^>]*>/i.test(body) ? body : textToHtml(body);
  const doc = new DOMParser().parseFromString(html, "text/html");

  doc.querySelectorAll(STRIP).forEach((el) => el.remove());
  for (const el of Array.from(doc.querySelectorAll("*"))) {
    for (const { name, value } of Array.from(el.attributes)) {
      if (/^on/i.test(name) || (/^(?:href|src|action|formaction|xlink:href)$/i.test(name) && UNSAFE_URL.test(value))) {
        el.removeAttribute(name);
      }
    }
  }
  // The frame is only ever as tall as its content, so a lazy image would never
  // scroll into view and never load.
  doc.querySelectorAll("img[loading]").forEach((img) => img.removeAttribute("loading"));
  doc.querySelectorAll("a[href]").forEach((a) => {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  });

  const designed = doc.querySelector(DESIGNED) !== null;
  if (!designed) trimBlankEdges(doc.body);
  const style = doc.createElement("style");
  style.textContent = baseStyles(palette, designed);
  doc.head.prepend(style);
  const csp = doc.createElement("meta");
  csp.setAttribute("http-equiv", "Content-Security-Policy");
  csp.setAttribute("content", CSP);
  doc.head.prepend(csp);

  // Always standards mode: in quirks mode the body stretches to the frame, so
  // the frame could never shrink to fit its content.
  return { srcDoc: `<!doctype html>${doc.documentElement.outerHTML}`, designed };
}

const fontFaceCache = new Map<string, string>();

/** The page's @font-face rules for `fontFamily`, so plain mail reads in the app's own type. */
export function fontFacesFor(fontFamily: string): string {
  const cached = fontFaceCache.get(fontFamily);
  if (cached !== undefined) return cached;
  const families = new Set(fontFamily.split(",").map((f) => f.trim().replace(/^["']|["']$/g, "").toLowerCase()));
  const rules: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let list: CSSRuleList;
    try {
      list = sheet.cssRules;
    } catch {
      continue; // a cross-origin stylesheet cannot be read, and has no font of ours
    }
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSFontFaceRule) {
        const family = rule.style.getPropertyValue("font-family").trim().replace(/^["']|["']$/g, "").toLowerCase();
        if (families.has(family)) rules.push(rule.cssText);
      }
    }
  }
  const css = rules.join("\n");
  fontFaceCache.set(fontFamily, css);
  return css;
}
