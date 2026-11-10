/** Compact relative time for list rows: "now", "5m", "3h", "Tue", "12 Mar". */
export function shortTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400 && date.getDate() === new Date().getDate()) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  if (diff < 6 * 86400) return date.toLocaleDateString(undefined, { weekday: "short" });
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function fullDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** ₹12.4L / ₹3.2Cr — the admin panel's CRM figures are INR. */
export function money(value: number | string | null | undefined, currency = "INR"): string {
  const n = Number(value) || 0;
  if (currency === "INR") {
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(1).replace(/\.0$/, "")}Cr`;
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(1).replace(/\.0$/, "")}L`;
    return `₹${n.toLocaleString("en-IN")}`;
  }
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export function initials(name: string | null | undefined): string {
  const parts = (name || "?").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

/** 1st, 2nd, 3rd, 11th, 21st. */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

/** A task's due date in words, and whether it needs attention. */
export function dueLabel(iso: string): { label: string; urgency: "overdue" | "today" | "later" } {
  const due = new Date(iso);
  const days = Math.round((new Date(due).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
  if (days < 0) return { label: "Overdue", urgency: "overdue" };
  if (days === 0) return { label: "Due today", urgency: "today" };
  if (days === 1) return { label: "Tomorrow", urgency: "later" };
  return { label: due.toLocaleDateString(undefined, { day: "numeric", month: "short" }), urgency: "later" };
}

export function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/**
 * Email bodies arrive as HTML from arbitrary senders. The app shows them as
 * plain text — no WebView, so nothing a sender writes can execute.
 */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Plain text → minimal safe HTML for outgoing replies. */
export function textToHtml(text: string): string {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  // Date-only values are calendar days: parse them locally, not as UTC midnight.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function clockTime(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "—";
}

export function hoursLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

/** YYYY-MM-DD in the device's timezone. */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
