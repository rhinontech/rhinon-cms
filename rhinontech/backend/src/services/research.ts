import axios from "axios";

// Strip a raw HTML document down to readable text.
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetch a lead's website and return readable text (homepage). Best-effort:
 * returns "" on any failure (bad URL, timeout, bot-block, non-HTML) so callers
 * can degrade gracefully.
 */
export async function fetchWebsiteText(url?: string | null, maxChars = 4000): Promise<string> {
  if (!url || !url.trim()) return "";
  let target = url.trim();
  if (!/^https?:\/\//i.test(target)) target = "https://" + target;

  try {
    const res = await axios.get(target, {
      timeout: 8000,
      maxRedirects: 5,
      responseType: "text",
      transformResponse: (d) => d, // keep raw string
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RhinonSalesBot/1.0; +https://rhinontech.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      validateStatus: (s) => s >= 200 && s < 400,
    });
    const contentType = String(res.headers["content-type"] || "");
    if (contentType && !/html|text/i.test(contentType)) return "";
    return htmlToText(String(res.data)).slice(0, maxChars);
  } catch {
    return "";
  }
}
