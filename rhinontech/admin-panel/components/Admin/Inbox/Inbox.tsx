"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { EmailBodyView } from "../Outreach/shared/EmailBodyView";
import {
  TbSearch, TbRefresh, TbPlus, TbX, TbPaperclip, TbSend2, TbFile, TbDownload,
  TbInfoCircle, TbMail, TbArchive, TbTrash, TbSend, TbArrowLeft,
} from "react-icons/tb";

type Folder = "inbox" | "sent" | "archive" | "trash";

interface Att { key: string; name: string; size: number; mimeType: string; url?: string }

interface Email {
  id: string; threadKey: string; folder: string;
  fromName: string; fromEmail: string; toEmails: string[]; ccEmails: string[];
  subject: string; body: string; snippet: string; ownerEmail: string;
  isRead: boolean; hasAttachment: boolean; sentAt: string;
  isInternal?: boolean; attachments?: Att[]; senderAvatarUrl?: string | null;
  campaign?: { id: string; name: string } | null;
  thread?: Email[];
}

const FOLDERS: Array<{ value: Folder; label: string; icon: React.ReactNode }> = [
  { value: "inbox", label: "Inbox", icon: <TbMail size={15} /> },
  { value: "sent", label: "Sent", icon: <TbSend size={15} /> },
  { value: "archive", label: "Archive", icon: <TbArchive size={15} /> },
  { value: "trash", label: "Trash", icon: <TbTrash size={15} /> },
];

const initials = (n: string) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
const relTime = (v: string) => {
  const m = Math.floor((Date.now() - new Date(v).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
};
const fmtTime = (v: string) => new Date(v).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const fmtDay = (v: string) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtFull = (v: string) => new Date(v).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const sizeLabel = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

async function uploadAttachment(file: File): Promise<Att> {
  const mimeType = file.type || "application/octet-stream";
  const { uploadUrl, key } = await apiFetch<{ uploadUrl: string; key: string }>("/inbox/attachments/presign", {
    method: "POST", body: JSON.stringify({ filename: file.name, mimeType }),
  });
  const put = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": mimeType } });
  if (!put.ok) throw new Error(`Upload failed for ${file.name}`);
  return { key, name: file.name, size: file.size, mimeType };
}

function AttachmentView({ att }: { att: Att }) {
  if (!att.url) return null;
  if (att.mimeType.startsWith("image/")) {
    return (
      <div className="mt-2 max-w-[280px] overflow-hidden rounded-lg border border-border bg-card">
        <a href={att.url} target="_blank" rel="noopener noreferrer"><img src={att.url} alt={att.name} className="max-h-48 w-full object-cover" /></a>
        <a href={att.url} target="_blank" rel="noopener noreferrer" download={att.name} className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-foreground/70 hover:bg-muted/40">
          <TbDownload size={13} /> Download
        </a>
      </div>
    );
  }
  if (att.mimeType.startsWith("audio/")) return <div className="mt-2"><audio controls src={att.url} className="h-10 max-w-[280px]" /><p className="mt-0.5 text-[10px] text-muted-foreground">{att.name}</p></div>;
  if (att.mimeType.startsWith("video/")) return <div className="mt-2 max-w-[320px] overflow-hidden rounded-lg border border-border bg-primary"><video controls src={att.url} className="max-h-56 w-full" /></div>;
  return (
    <a href={att.url} target="_blank" rel="noopener noreferrer" className="mt-2 flex w-fit items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground/85 hover:bg-muted/40">
      <TbFile size={15} className="shrink-0 text-muted-foreground" /><span className="max-w-[180px] truncate">{att.name}</span>
      <span className="text-muted-foreground">{sizeLabel(att.size)}</span><TbDownload size={13} className="text-muted-foreground" />
    </a>
  );
}

function ComposeModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [to, setTo] = useState(""); const [subject, setSubject] = useState(""); const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [contacts, setContacts] = useState<Array<{ fullName: string; companyEmail: string }>>([]);
  const [toFocused, setToFocused] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch<Array<{ fullName: string; companyEmail: string }>>("/inbox/contacts").then(setContacts).catch(() => { });
  }, []);

  // Suggestions match the fragment after the last comma; already-added
  // addresses are excluded so the list shrinks as recipients are picked.
  const fragment = to.split(",").pop()?.trim().toLowerCase() ?? "";
  const chosen = to.toLowerCase();
  const suggestions = toFocused
    ? contacts.filter((c) =>
      !chosen.includes(c.companyEmail.toLowerCase()) &&
      (!fragment || c.companyEmail.toLowerCase().includes(fragment) || c.fullName.toLowerCase().includes(fragment))
    ).slice(0, 6)
    : [];

  const pickContact = (email: string) => {
    const parts = to.split(",").map((t) => t.trim()).filter(Boolean);
    parts.pop(); // drop the fragment being typed
    setTo([...parts.filter((p) => p.toLowerCase() !== email.toLowerCase()), email].join(", ") + ", ");
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const attachments: Att[] = [];
      for (const f of files) attachments.push(await uploadAttachment(f));
      await apiFetch("/inbox", {
        method: "POST",
        body: JSON.stringify({ toEmails: to.split(",").map((t) => t.trim()).filter(Boolean), subject, body, attachments }),
      });
      onSent(); onClose();
    } catch (err: any) { setError(err.message || "Could not send."); } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl glass-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex h-14 items-center justify-between border-b px-5">
          <p className="font-semibold tracking-tight">New Email</p>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted"><TbX size={18} /></button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3 p-5">
          <div className="relative">
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="To (comma-separated)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              onFocus={() => setToFocused(true)}
              onBlur={() => setTimeout(() => setToFocused(false), 150)}
              required
            />
            {suggestions.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border bg-card p-1 shadow-lg">
                {suggestions.map((c) => (
                  <button
                    key={c.companyEmail}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); pickContact(c.companyEmail); }}
                    className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left hover:bg-muted/40"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-400/10 text-[10px] font-semibold text-teal-700 dark:text-teal-300">{initials(c.fullName)}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">{c.fullName}</span>
                      <span className="block truncate text-xs text-muted-foreground">{c.companyEmail}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          <textarea className="min-h-32 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Write your message..." value={body} onChange={(e) => setBody(e.target.value)} required />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-foreground/70 hover:bg-muted/40">
              <TbPaperclip size={14} /> Attach files
            </button>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])])} />
            {files.map((f, i) => (
              <span key={i} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground/70">
                {f.name}<button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}><TbX size={12} /></button>
              </span>
            ))}
          </div>
          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 border-t pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted/40">Cancel</button>
            <button type="submit" disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{busy ? "Sending..." : "Send"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Inbox() {
  const [folder, setFolder] = useState<Folder>("inbox");
  const [search, setSearch] = useState("");
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Email | null>(null);
  const [showInfo, setShowInfo] = useState(true);       // desktop info column
  const [mobileInfo, setMobileInfo] = useState(false);  // phone slide-over
  const [showCompose, setShowCompose] = useState(false);

  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<Att[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ folder });
      if (search.trim()) params.set("search", search.trim());
      const data = await apiFetch<Email[]>(`/inbox?${params.toString()}`);
      setEmails(data);
      setSelectedId((cur) => {
        if (cur && data.some((e) => e.id === cur)) return cur;
        // Auto-open the first email only on desktop — on phones the list is
        // the landing view and auto-selecting would hide it behind the thread.
        const desktop = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
        return desktop ? data[0]?.id ?? null : null;
      });
    } finally { setLoading(false); }
  }, [folder, search]);

  useEffect(() => {
    const t = setTimeout(fetchEmails, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchEmails, search]);

  const fetchDetail = useCallback(async (id: string) => {
    const data = await apiFetch<Email>(`/inbox/${id}`);
    setDetail(data);
    setEmails((items) => items.map((i) => (i.id === id ? { ...i, isRead: true } : i)));
  }, []);

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId); else setDetail(null);
  }, [selectedId, fetchDetail]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [detail?.thread?.length]);

  const attachFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try { for (const f of Array.from(files)) { const a = await uploadAttachment(f); setPending((p) => [...p, a]); } }
    catch (err: any) { alert(err.message || "Upload failed."); }
    finally { setUploading(false); }
  };

  const send = async () => {
    if (!detail || sending || uploading || (!draft.trim() && pending.length === 0)) return;
    setSending(true);
    try {
      await apiFetch(`/inbox/${detail.id}/${mode === "note" ? "note" : "reply"}`, {
        method: "POST", body: JSON.stringify({ body: draft.trim(), attachments: pending }),
      });
      setDraft(""); setPending([]);
      await fetchDetail(detail.id);
    } catch (err: any) { alert(err.message || "Could not send."); }
    finally { setSending(false); }
  };

  const moveTo = async (target: Folder) => {
    if (!detail) return;
    await apiFetch(`/inbox/${detail.id}`, { method: "PATCH", body: JSON.stringify({ folder: target }) });
    fetchEmails();
  };

  const thread = detail?.thread ?? (detail ? [detail] : []);
  const isMine = (m: Email) => m.isInternal || m.fromEmail.toLowerCase() === (detail?.ownerEmail ?? "").toLowerCase();
  const daySeparated = useMemo(() => {
    const out: Array<{ day: string | null; msg: Email }> = [];
    let last = "";
    for (const m of thread) {
      const d = new Date(m.sentAt).toDateString();
      out.push({ day: d !== last ? fmtDay(m.sentAt) : null, msg: m });
      last = d;
    }
    return out;
  }, [thread]);
  const firstInbound = thread.find((m) => !isMine(m)) ?? detail;

  return (
    <div className="flex min-h-0 h-full gap-2 overflow-hidden">
      {/* Left: list */}
      <main className={cn(
        "min-h-0 min-w-0 h-full w-full flex-col glass-panel rounded-xl overflow-hidden lg:flex lg:w-[340px] lg:shrink-0",
        selectedId ? "hidden" : "flex"
      )}>
        <div className="flex h-16 items-center justify-between border-b border-border px-4 glass-header">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-400/10 text-blue-600 dark:text-blue-300"><TbMail size={17} /></span>
            <p className="text-lg font-semibold tracking-tight">Inbox</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={fetchEmails} title="Refresh" className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><TbRefresh size={16} /></button>
            <button onClick={() => setShowCompose(true)} title="New email" className="rounded-lg bg-primary p-2 text-primary-foreground hover:bg-primary/90"><TbPlus size={16} /></button>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-b border-border p-3">
          <div className="relative">
            <TbSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subject, name or email" className="w-full rounded-lg border border-border py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-1">
            {FOLDERS.map((f) => (
              <button key={f.value} onClick={() => setFolder(f.value)} className={cn("flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium", folder === f.value ? "bg-primary text-primary-foreground" : "border text-muted-foreground hover:bg-muted/40")}>
                {f.icon} {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading...</div>
            : emails.length === 0 ? <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">No emails</div>
              : emails.map((e) => (
                <button key={e.id} onClick={() => setSelectedId(e.id)} className={cn("flex w-full items-start gap-2.5 border-b border-border px-4 py-3 text-left transition-colors", selectedId === e.id ? "bg-blue-50/60 dark:bg-blue-400/10" : "hover:bg-muted/40")}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-400/10 text-xs font-semibold text-teal-700 dark:text-teal-300">{initials(e.fromName)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("truncate text-sm", e.isRead ? "font-medium text-foreground/85" : "font-bold text-foreground")}>{e.fromName}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{relTime(e.sentAt)}</span>
                    </div>
                    <p className="truncate text-xs font-medium text-foreground/85">{e.subject}</p>
                    {e.campaign && (
                      <span className="mt-0.5 inline-block truncate rounded-full bg-violet-50 dark:bg-violet-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-300">
                        {e.campaign.name}
                      </span>
                    )}
                    <p className="truncate text-[11px] text-muted-foreground">{e.hasAttachment && <TbPaperclip size={10} className="mr-0.5 inline" />}{e.snippet}</p>
                  </div>
                </button>
              ))}
        </div>
      </main>

      {/* Middle: thread */}
      <section className={cn(
        "min-h-0 min-w-0 h-full flex-1 flex-col glass-panel rounded-xl overflow-hidden lg:flex",
        selectedId ? "flex" : "hidden"
      )}>
        {!detail ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Select an email to view the conversation.</div>
        ) : (
          <>
            <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-3 sm:px-5 glass-header">
              <div className="flex min-w-0 items-center gap-1.5">
                <button onClick={() => setSelectedId(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden" aria-label="Back to list">
                  <TbArrowLeft size={18} />
                </button>
                <p className="min-w-0 truncate text-sm font-semibold text-foreground">{detail.subject}</p>
                {detail.campaign && (
                  <span className="shrink-0 rounded-full bg-violet-50 dark:bg-violet-400/10 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-300">
                    {detail.campaign.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {folder !== "archive" && <button onClick={() => moveTo("archive")} title="Archive" className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><TbArchive size={16} /></button>}
                {folder !== "trash" && <button onClick={() => moveTo("trash")} title="Delete" className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><TbTrash size={16} /></button>}
                <button
                  onClick={() => { setShowInfo((s) => !s); setMobileInfo(true); }}
                  className={cn("rounded-lg p-2", showInfo ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted")}
                >
                  <TbInfoCircle size={17} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-muted/40 px-3 sm:px-5 py-4">
              {daySeparated.map(({ day, msg }) => (
                <div key={msg.id}>
                  {day && <div className="my-3 flex justify-center"><span className="rounded-full bg-card px-3 py-1 text-[10px] font-medium text-muted-foreground shadow-sm">{day}</span></div>}
                  {!isMine(msg) ? (
                    <div className="mb-3 flex items-start gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-50 dark:bg-teal-400/10 text-[10px] font-semibold text-teal-700 dark:text-teal-300">
                        {msg.senderAvatarUrl ? <img src={msg.senderAvatarUrl} alt="" className="h-full w-full object-cover" /> : initials(msg.fromName)}
                      </div>
                      <div className="min-w-0 max-w-[85%] sm:max-w-[70%] rounded-xl rounded-tl-sm border border-border bg-card px-4 py-3 shadow-sm">
                        <p className="mb-1 text-[11px] text-muted-foreground">{msg.fromName} · {fmtTime(msg.sentAt)}</p>
                        <div className="max-w-full overflow-x-auto">
                          <EmailBodyView
                            body={msg.body}
                            proseClassName="prose prose-sm max-w-none break-words text-sm text-foreground [&_*]:!my-0.5 [&_img]:h-auto [&_img]:max-w-full [&_table]:max-w-full"
                          />
                        </div>
                        {(msg.attachments ?? []).map((a) => <AttachmentView key={a.key} att={a} />)}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3 flex items-start justify-end gap-2.5">
                      <div className={cn("min-w-0 max-w-[85%] sm:max-w-[70%] rounded-xl rounded-tr-sm px-4 py-3 shadow-sm", msg.isInternal ? "border border-amber-200 dark:border-amber-400/25 bg-amber-50 dark:bg-amber-400/10" : "bg-blue-600")}>
                        <p className={cn("mb-1 text-[11px]", msg.isInternal ? "text-amber-600 dark:text-amber-300" : "text-blue-200")}>{msg.fromName} · {fmtTime(msg.sentAt)}{msg.isInternal ? " · Internal note" : ""}</p>
                        {msg.body && <p className={cn("whitespace-pre-wrap text-sm", msg.isInternal ? "text-amber-900 dark:text-amber-200" : "text-white")}>{msg.body.replace(/<[^>]*>/g, "")}</p>}
                        {(msg.attachments ?? []).map((a) => <AttachmentView key={a.key} att={a} />)}
                      </div>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                        {msg.senderAvatarUrl ? <img src={msg.senderAvatarUrl} alt="" className="h-full w-full object-cover" /> : initials(msg.fromName)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* Composer */}
            <div className="border-t border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex gap-2">
                  <button onClick={() => setMode("reply")} className={cn("rounded-full px-3.5 py-1.5 text-xs font-semibold", mode === "reply" ? "bg-blue-600 text-white" : "border text-muted-foreground hover:bg-muted/40")}>Reply</button>
                  <button onClick={() => setMode("note")} className={cn("rounded-full px-3.5 py-1.5 text-xs font-semibold", mode === "note" ? "bg-amber-500 text-white" : "border text-muted-foreground hover:bg-muted/40")}>Internal note</button>
                </div>
                <span className="hidden text-[11px] text-muted-foreground sm:inline">{mode === "note" ? "Visible to the team only — never emailed." : `Emailed to ${detail.fromEmail}`}</span>
              </div>
              {pending.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {pending.map((a, i) => (
                    <span key={a.key} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground/70">
                      <TbPaperclip size={11} /> {a.name}
                      <button onClick={() => setPending(pending.filter((_, j) => j !== i))}><TbX size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <button onClick={() => fileRef.current?.click()} disabled={uploading} title="Attach images, audio, video or files" className="rounded-lg border p-2.5 text-muted-foreground hover:bg-muted/40 disabled:opacity-50"><TbPaperclip size={17} /></button>
                <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { attachFiles(e.target.files); e.target.value = ""; }} />
                <textarea
                  value={draft} onChange={(e) => setDraft(e.target.value)} rows={1}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={
                    uploading
                      ? "Uploading attachment..."
                      : isMobile
                        ? `${mode === "note" ? "Add internal note" : "Reply"}...`
                        : `${mode === "note" ? "Add an internal note" : "Reply"}...  (Enter to send, Shift+Enter for new line)`
                  }
                  className="max-h-32 min-h-[42px] flex-1 resize-y rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={send} disabled={sending || uploading || (!draft.trim() && pending.length === 0)} className={cn("rounded-lg p-2.5 text-white disabled:opacity-40", mode === "note" ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700")}><TbSend2 size={17} /></button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Right: info */}
      {detail && mobileInfo && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMobileInfo(false)} />
      )}
      {detail && (showInfo || mobileInfo) && (
        <aside className={cn(
          "min-h-0 flex-col overflow-y-auto bg-card p-5",
          // phone: right slide-over; desktop: static column controlled by showInfo
          mobileInfo ? "fixed inset-y-0 right-0 z-50 flex w-[85vw] max-w-[320px] shadow-xl" : "hidden",
          showInfo ? "lg:static lg:z-auto lg:flex lg:h-full lg:w-[280px] lg:max-w-none lg:shrink-0 lg:rounded-xl lg:shadow-none" : "lg:hidden"
        )}>
          <button onClick={() => setMobileInfo(false)} className="mb-2 self-end rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden" aria-label="Close details">
            <TbX size={18} />
          </button>
          <p className="mb-4 text-base font-semibold text-foreground">{detail.subject}</p>
          <div className="flex flex-col gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium text-foreground">{firstInbound?.fromName ?? detail.fromName}</p></div>
            <div><p className="text-xs text-muted-foreground">Email</p><p className="break-all font-medium text-foreground">{firstInbound?.fromEmail ?? detail.fromEmail}</p></div>
            <div><p className="text-xs text-muted-foreground">To</p><p className="break-all font-medium text-foreground">{detail.toEmails.join(", ")}</p></div>
          </div>
          <div className="mt-6 border-t pt-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Timeline</p>
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <p>First message: {thread[0] ? fmtFull(thread[0].sentAt) : "—"}</p>
              <p>Latest: {thread.length ? fmtFull(thread[thread.length - 1].sentAt) : "—"}</p>
              <p>Messages: {thread.filter((m) => !m.isInternal).length} · Notes: {thread.filter((m) => m.isInternal).length}</p>
            </div>
          </div>
        </aside>
      )}

      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onSent={fetchEmails} />}
    </div>
  );
}
