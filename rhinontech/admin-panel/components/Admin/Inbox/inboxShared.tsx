"use client";

import { TbDownload, TbFile, TbFileTypePdf, TbMusic, TbVideo } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { NativeSelect } from "@/components/ui/native-select";

export type MailFolder = "inbox" | "sent" | "archive" | "trash";
/** "bounced" is not a folder on the server: it is a report built from bounce notices. */
export type Folder = MailFolder | "bounced";

export interface Att { key: string; name: string; size: number; mimeType: string; url?: string }

export interface Email {
  id: string; threadKey: string; folder: string;
  fromName: string; fromEmail: string; toEmails: string[]; ccEmails: string[];
  /** Only on a single message or a thread; the list leaves bodies out. */
  body?: string;
  subject: string; snippet: string; ownerEmail: string;
  isRead: boolean; hasAttachment: boolean; sentAt: string;
  messageId?: string | null;
  isInternal?: boolean; attachments?: Att[]; senderAvatarUrl?: string | null;
  campaign?: { id: string; name: string } | null;
  thread?: Email[];
  /** Set on thread messages: sent by the viewer from any of their addresses. */
  fromMe?: boolean;
}

/** An address the viewer can send from, as it reads in the brand being viewed. */
export interface SenderAddress { address: string; name: string; shared: boolean }

export interface BouncedAddress {
  address: string;
  bounced: number;
  delayed: number;
  sent: number;
  lastNoticeAt: string;
  lastSentAt: string | null;
  status: string | null;
  reason: string | null;
  notices: Array<{ at: string; action: "failed" | "delayed"; status: string | null; reason: string | null }>;
  sends: Array<{ at: string; subject: string }>;
}

export interface BounceReport { addresses: BouncedAddress[]; notices: number; unmatched: number }

export const localPart = (address: string) => address.split("@")[0].toLowerCase();

/**
 * The viewer's address a message belongs to. Brands change only the domain
 * (hello@rhinontech.in and hello@uppercurve.in are one mailbox), so the local
 * part identifies it.
 */
export const addressFor = (addresses: SenderAddress[], ownerEmail: string) =>
  addresses.find((a) => localPart(a.address) === localPart(ownerEmail || ""));

export const initials = (name: string) =>
  name.split(/[\s._@-]+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";

// One stable tint per correspondent, so a sender is recognisable down the list.
const TONES = [
  "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-400/15 dark:text-fuchsia-300",
];

export function toneFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return TONES[hash % TONES.length];
}

const AVATAR_SIZES = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-[11px]", lg: "h-14 w-14 text-base" };

export function Avatar({ name, seed, src, size = "md", className }: {
  name: string; seed?: string; src?: string | null; size?: keyof typeof AVATAR_SIZES; className?: string;
}) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold", AVATAR_SIZES[size], toneFor((seed || name).toLowerCase()), className)}>
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials(name)}
    </span>
  );
}

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const yesterdayOf = (now: Date) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
const clock = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/** List timestamps: the time today, then "Yesterday", the weekday, the date. */
export function listTime(value: string): string {
  const d = new Date(value);
  const now = new Date();
  if (sameDay(d, now)) return clock(d);
  if (sameDay(d, yesterdayOf(now))) return "Yesterday";
  if (now.getTime() - d.getTime() < 6 * 86_400_000) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", d.getFullYear() === now.getFullYear()
    ? { month: "short", day: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" });
}

/** A message's own timestamp: "Today, 1:01 PM", "Oct 22, 9:35 AM". */
export function stampTime(value: string): string {
  const d = new Date(value);
  const now = new Date();
  if (sameDay(d, now)) return `Today, ${clock(d)}`;
  if (sameDay(d, yesterdayOf(now))) return `Yesterday, ${clock(d)}`;
  const date = d.toLocaleDateString("en-US", d.getFullYear() === now.getFullYear()
    ? { month: "short", day: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" });
  return `${date}, ${clock(d)}`;
}

export const fullTime = (value: string) =>
  new Date(value).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export const sizeLabel = (b: number) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

/** A short plain-text line from a message body, for collapsed thread rows. */
export function bodyPreview(body = ""): string {
  return body
    .replace(/<(head|style|script|title)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/([-_=*~])\1{3,}/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export async function uploadAttachment(file: File): Promise<Att> {
  const mimeType = file.type || "application/octet-stream";
  const { uploadUrl, key } = await apiFetch<{ uploadUrl: string; key: string }>("/inbox/attachments/presign", {
    method: "POST", body: JSON.stringify({ filename: file.name, mimeType }),
  });
  const put = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": mimeType } });
  if (!put.ok) throw new Error(`Upload failed for ${file.name}`);
  return { key, name: file.name, size: file.size, mimeType };
}

function fileIcon(mimeType: string) {
  if (mimeType === "application/pdf") return <TbFileTypePdf size={16} />;
  if (mimeType.startsWith("audio/")) return <TbMusic size={16} />;
  if (mimeType.startsWith("video/")) return <TbVideo size={16} />;
  return <TbFile size={16} />;
}

export function AttachmentView({ att }: { att: Att }) {
  if (!att.url) return null;
  if (att.mimeType.startsWith("image/")) {
    return (
      <a href={att.url} target="_blank" rel="noopener noreferrer" className="group block w-44 overflow-hidden rounded-lg border bg-card shadow-xs transition hover:shadow-sm">
        <img src={att.url} alt={att.name} className="h-28 w-full object-cover" />
        <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-muted-foreground">
          <span className="min-w-0 flex-1 truncate font-medium text-foreground/85">{att.name}</span>
          <TbDownload size={12} className="shrink-0 opacity-60 group-hover:opacity-100" />
        </span>
      </a>
    );
  }
  if (att.mimeType.startsWith("audio/")) {
    return (
      <div className="w-full max-w-[300px] rounded-lg border bg-card p-2 shadow-xs">
        <audio controls src={att.url} className="h-9 w-full" />
        <p className="mt-1 truncate px-1 text-[11px] text-muted-foreground">{att.name}</p>
      </div>
    );
  }
  if (att.mimeType.startsWith("video/")) {
    return <video controls src={att.url} className="max-h-56 w-full max-w-[320px] rounded-lg border bg-black shadow-xs" />;
  }
  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      download={att.name}
      className="group flex w-full max-w-[260px] items-center gap-2.5 rounded-lg border bg-card px-2.5 py-2 shadow-xs transition hover:bg-muted/40"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">{fileIcon(att.mimeType)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-foreground">{att.name}</span>
        <span className="block text-[11px] text-muted-foreground">{sizeLabel(att.size)}</span>
      </span>
      <TbDownload size={14} className="shrink-0 text-muted-foreground opacity-60 group-hover:opacity-100" />
    </a>
  );
}

export function FromSelect({ addresses, value, onChange, compact = false }: {
  addresses: SenderAddress[]; value: string; onChange: (v: string) => void; compact?: boolean;
}) {
  if (addresses.length < 2) return null;
  return (
    <label className={cn("flex min-w-0 items-center gap-2 text-xs text-muted-foreground", compact ? "" : "rounded-lg border px-3 py-1.5")}>
      <span className="shrink-0">From</span>
      <NativeSelect
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 truncate bg-transparent text-xs font-medium text-foreground focus:outline-none"
        aria-label="Send from"
      >
        {addresses.map((a) => (
          <option key={a.address} value={a.address}>
            {a.name ? `${a.name} <${a.address}>` : a.address}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
}

/** A quiet square icon button for toolbars. */
export function IconButton({ className, active, ...props }: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40",
        active && "bg-foreground/[0.07] text-foreground",
        className
      )}
      {...props}
    />
  );
}

/** Centered message for empty and failed states. */
export function PaneMessage({ icon, title, body, action }: { icon: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground/[0.05] text-muted-foreground ring-1 ring-inset ring-foreground/[0.06]">{icon}</span>
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      {body && <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
