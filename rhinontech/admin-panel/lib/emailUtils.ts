export interface ParsedEmailBody {
  cleaned: string;
  raw: string;
  hasQuoted: boolean;
}

/**
 * Parses email HTML content to extract the new reply text and isolate quoted reply content.
 */
export function parseEmailBody(html: string): ParsedEmailBody {
  if (!html || typeof html !== "string") {
    return { cleaned: "", raw: html || "", hasQuoted: false };
  }

  const raw = html.trim();
  if (!raw) return { cleaned: "", raw: "", hasQuoted: false };

  // Try DOMParser approach in browser environments
  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(raw, "text/html");
      const body = doc.body;

      // Selectors commonly used by email clients (Gmail, Outlook, Yahoo, Apple Mail, etc.) for quoted text
      const quoteSelectors = [
        "blockquote",
        ".gmail_quote",
        ".gmail_attr",
        "#divRplyFwdMsg",
        "#appendonsend",
        ".yahoo_quoted",
        "[aria-label='Quote']",
        "div[style*='border-left']",
      ];

      let quoteNode: Node | null = null;

      for (const sel of quoteSelectors) {
        const el = body.querySelector(sel);
        if (el) {
          quoteNode = el;
          break;
        }
      }

      // If no specific container element, look for elements whose text content matches quote headers
      if (!quoteNode) {
        const candidates = Array.from(body.querySelectorAll("p, div, span, font, td, br"));
        for (const el of candidates) {
          const text = (el.textContent || "").trim();
          if (
            /On\s+[\s\S]{1,150}?\s+wrote:\s*$/i.test(text) ||
            /-{3,}\s*Original Message\s*-{3,}/i.test(text) ||
            /________________________________/i.test(text) ||
            /^From:\s*.*?\n?Sent:/i.test(text)
          ) {
            quoteNode = el;
            break;
          }
        }
      }

      if (quoteNode) {
        // If quoteNode's previous sibling is an email attribution header (e.g., "On ... wrote:"), include it in removal
        let prev = quoteNode.previousSibling;
        while (prev) {
          const prevText = (prev.textContent || "").trim();
          if (
            (prev instanceof Element && (prev.classList.contains("gmail_attr") || prev.tagName === "BR")) ||
            /On\s+[\s\S]{1,150}?\s+wrote:\s*$/i.test(prevText) ||
            /-{3,}\s*Original Message\s*-{3,}/i.test(prevText)
          ) {
            quoteNode = prev;
            prev = quoteNode.previousSibling;
          } else if (prevText === "") {
            prev = prev.previousSibling;
          } else {
            break;
          }
        }

        // Remove the quoteNode and all subsequent siblings up through the DOM hierarchy
        let current: Node | null = quoteNode;
        while (current && current !== body) {
          let sibling = current.nextSibling;
          while (sibling) {
            const next = sibling.nextSibling;
            sibling.parentNode?.removeChild(sibling);
            sibling = next;
          }
          const parentNode: ParentNode | null = current.parentNode;
          parentNode?.removeChild(current);
          current = parentNode as Node | null;
        }

        const cleanedHtml = body.innerHTML.trim();
        if (cleanedHtml && cleanedHtml !== raw) {
          return { cleaned: cleanedHtml, raw, hasQuoted: true };
        }
      }
    } catch {
      // Fall through to regex if DOM parsing fails
    }
  }

  // Fallback regex pattern matching for string HTML / plain text
  const regexPatterns = [
    /<blockquote[\s\S]*$/i,
    /<div[^>]*class=["'](?:gmail_quote|gmail_attr|yahoo_quoted)["'][\s\S]*$/i,
    /<div[^>]*id=["'](?:divRplyFwdMsg|appendonsend)["'][\s\S]*$/i,
    /(?:<p[^>]*>|<div[^>]*>|\n|^)[^<]*?On\s+[\s\S]{1,200}?\s+wrote:[\s\S]*$/i,
    /-{3,}\s*Original Message\s*-{3,}[\s\S]*$/i,
  ];

  for (const pattern of regexPatterns) {
    const match = raw.match(pattern);
    if (match && match.index !== undefined && match.index > 0) {
      const cleaned = raw.substring(0, match.index).trim();
      if (cleaned) {
        return { cleaned, raw, hasQuoted: true };
      }
    }
  }

  return { cleaned: raw, raw, hasQuoted: false };
}
