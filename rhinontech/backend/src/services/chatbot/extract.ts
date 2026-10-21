import axios from "axios";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import path from "node:path";
import * as cheerio from "cheerio";
import JSZip from "jszip";
import mammoth from "mammoth";
// The package root runs a debug harness that reads a test PDF from disk.
import pdfParse from "pdf-parse/lib/pdf-parse.js";

/**
 * Turns training sources into plain text.
 *
 * URLs here are typed by customers, and the fetch runs inside our VPC, so every
 * connection is checked against private, loopback and link-local ranges — at
 * connect time, via the agents' lookup, so a hostname that re-resolves to
 * 169.254.169.254 between a check and the fetch is still refused.
 */

const MAX_PAGE_BYTES = 3 * 1024 * 1024;
const MAX_SITEMAP_PAGES = 200;

function isBlockedAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
      (a === 169 && b === 254) ||            // link-local, incl. the EC2 metadata service
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224                               // multicast + reserved
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isBlockedAddress(v6.slice(7));
  return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

const safeLookup: net.LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 4);
    const list = addresses as dns.LookupAddress[];
    const bad = list.find((a) => isBlockedAddress(a.address));
    if (bad || list.length === 0) {
      return callback(new Error(`Refusing to fetch ${hostname}: not a public address`), "", 4);
    }
    if ((options as dns.LookupOptions).all) return (callback as any)(null, list);
    callback(null, list[0].address, list[0].family);
  });
};

const httpAgent = new http.Agent({ lookup: safeLookup });
const httpsAgent = new https.Agent({ lookup: safeLookup });

function assertHttpUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("That is not a valid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only http and https links can be trained.");
  if (url.username || url.password) throw new Error("Links with credentials cannot be trained.");
  assertPublicHost(url.hostname);
  return url;
}

/**
 * Node never calls `lookup` for an IP literal, so the agents' check cannot see
 * http://169.254.169.254/ — it has to be refused here, and again on every
 * redirect hop (see beforeRedirect below).
 */
function assertPublicHost(hostname: string) {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || (net.isIP(host) && isBlockedAddress(host))) {
    throw new Error(`Refusing to fetch ${hostname}: not a public address`);
  }
}

async function fetchText(raw: string): Promise<{ body: string; contentType: string; finalUrl: string }> {
  const url = assertHttpUrl(raw);
  const res = await axios.get<string>(url.toString(), {
    httpAgent,
    httpsAgent,
    timeout: 15_000,
    maxRedirects: 5,
    beforeRedirect: (options: Record<string, any>) => {
      if (options.protocol !== "http:" && options.protocol !== "https:") throw new Error("Redirect to a non-web link refused.");
      assertPublicHost(String(options.hostname || ""));
    },
    maxContentLength: MAX_PAGE_BYTES,
    responseType: "text",
    // A browser-like UA: many marketing sites serve bots a stripped page.
    headers: { "User-Agent": "Mozilla/5.0 (compatible; RhinonBot/1.0; +https://rhinontech.in)", Accept: "text/html,application/xml;q=0.9,*/*;q=0.8" },
    validateStatus: (s) => s >= 200 && s < 300,
    transformResponse: (d) => d,
  });
  return {
    body: String(res.data ?? ""),
    contentType: String(res.headers["content-type"] || ""),
    finalUrl: (res.request as any)?.res?.responseUrl || url.toString(),
  };
}

/** Readable text of an HTML page: title, headings, paragraphs, lists — not menus and scripts. */
export function htmlToText(html: string): { title: string; text: string } {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, iframe, template, nav, footer, header, form, [aria-hidden=true]").remove();
  const title = ($("title").first().text() || $("h1").first().text() || "").trim().replace(/\s+/g, " ");
  const root = $("main").length ? $("main") : $("body");
  const blocks: string[] = [];
  root.find("h1, h2, h3, h4, h5, h6, p, li, td, th, blockquote, pre, dt, dd").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t.length > 1) blocks.push(t);
  });
  // Pages built from bare <div>s have none of the tags above; fall back to all text.
  const text = blocks.length >= 3 ? blocks.join("\n") : root.text().replace(/\s+/g, " ").trim();
  // Consecutive duplicates come from nested matches (li > p); drop them.
  return { title, text: text.split("\n").filter((line, i, all) => line !== all[i - 1]).join("\n") };
}

export async function extractUrl(url: string): Promise<{ title: string; text: string }> {
  const { body, contentType } = await fetchText(url);
  if (contentType.includes("text/plain")) return { title: url, text: body };
  return htmlToText(body);
}

/** Page URLs listed in a sitemap (follows one level of sitemap index). */
export async function sitemapUrls(siteOrSitemapUrl: string): Promise<string[]> {
  const base = assertHttpUrl(siteOrSitemapUrl);
  const sitemap = base.pathname.endsWith(".xml") ? base.toString() : new URL("/sitemap.xml", base).toString();
  const { body } = await fetchText(sitemap);
  const $ = cheerio.load(body, { xmlMode: true });
  const host = base.hostname.replace(/^www\./, "");
  const sameSite = (u: string) => {
    try {
      return new URL(u).hostname.replace(/^www\./, "") === host;
    } catch {
      return false;
    }
  };

  const pages = $("url > loc").map((_, el) => $(el).text().trim()).get().filter(sameSite);
  if (pages.length) return Array.from(new Set(pages)).slice(0, MAX_SITEMAP_PAGES);

  // Sitemap index: read its child sitemaps until we have enough pages.
  const children = $("sitemap > loc").map((_, el) => $(el).text().trim()).get().filter(sameSite);
  const out = new Set<string>();
  for (const child of children) {
    if (out.size >= MAX_SITEMAP_PAGES) break;
    try {
      const { body: childXml } = await fetchText(child);
      const $c = cheerio.load(childXml, { xmlMode: true });
      $c("url > loc").each((_, el) => {
        const u = $c(el).text().trim();
        if (sameSite(u) && out.size < MAX_SITEMAP_PAGES) out.add(u);
      });
    } catch {
      // One unreadable child sitemap should not sink the rest.
    }
  }
  return Array.from(out);
}

/** Quick look at a site before training it: title and whether a sitemap exists. */
export async function analyzeUrl(url: string): Promise<{ url: string; title: string; domain: string; sitemapPages: number }> {
  const { title } = await extractUrl(url);
  let sitemapPages = 0;
  try {
    sitemapPages = (await sitemapUrls(url)).length;
  } catch {
    sitemapPages = 0;
  }
  return { url, title: title || new URL(url).hostname, domain: new URL(url).hostname, sitemapPages };
}

async function pptxText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slides = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));
  const parts: string[] = [];
  for (const name of slides) {
    const xml = await zip.files[name].async("string");
    const $ = cheerio.load(xml, { xmlMode: true });
    const text = $("a\\:t").map((_, el) => $(el).text()).get().join(" ").trim();
    if (text) parts.push(text);
  }
  return parts.join("\n");
}

export const TRAINABLE_EXTENSIONS = [".pdf", ".docx", ".pptx", ".txt", ".md", ".csv"];

export async function extractFile(buffer: Buffer, fileName: string): Promise<string> {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".pdf":
      return (await pdfParse(buffer)).text;
    case ".docx":
      return (await mammoth.extractRawText({ buffer })).value;
    case ".pptx":
      return pptxText(buffer);
    case ".txt":
    case ".md":
    case ".csv":
      return buffer.toString("utf8");
    default:
      throw new Error(`${ext || "This file type"} can't be trained. Use PDF, DOCX, PPTX, TXT, MD or CSV.`);
  }
}

/**
 * Splits text into overlapping chunks on paragraph and sentence boundaries.
 * ~1,200 characters is a few paragraphs: enough context to answer from, small
 * enough that one retrieved chunk is mostly on-topic.
 */
export function chunkText(text: string, size = 1200, overlap = 150): string[] {
  const clean = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);
    if (end < clean.length) {
      const window = clean.slice(start, end);
      const cut = Math.max(window.lastIndexOf("\n"), window.lastIndexOf(". "));
      if (cut > size * 0.5) end = start + cut + 1;
    }
    const piece = clean.slice(start, end).trim();
    if (piece.length > 40) chunks.push(piece);
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}
