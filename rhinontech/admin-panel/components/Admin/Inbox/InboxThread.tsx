"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  TbArchive, TbArrowBackUp, TbArrowLeft, TbCopy, TbCheck, TbInfoCircle, TbNote, TbPaperclip,
  TbPencil, TbSend2, TbTrash, TbX,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { alertDialog } from "@/components/ui/dialogs";
import { Button } from "@/components/ui/button";
import { EmailBodyView } from "../Outreach/shared/EmailBodyView";
import {
  addressFor, AttachmentView, Avatar, bodyPreview, FromSelect, fullTime, IconButton, stampTime,
  uploadAttachment, type Att, type Email, type MailFolder, type SenderAddress,
} from "./inboxShared";

/** Threads longer than this open with their middle folded away. */
const FOLD_AFTER = 5;

function isMine(message: Email, ownerEmail: string) {
  return !!message.isInternal || (message.fromMe ?? message.fromEmail.toLowerCase() === ownerEmail.toLowerCase());
}

export function InboxThread({ detail, folder, addresses, infoOpen, onToggleInfo, onBack, onMove, onReplied }: {
  detail: Email;
  folder: MailFolder;
  addresses: SenderAddress[];
  infoOpen: boolean;
  onToggleInfo: () => void;
  onBack: () => void;
  onMove: (target: MailFolder) => void;
  onReplied: () => Promise<void>;
}) {
  const thread = useMemo(() => detail.thread ?? [detail], [detail]);
  const latestInbound = useMemo(() => [...thread].reverse().find((m) => !isMine(m, detail.ownerEmail)), [thread, detail.ownerEmail]);
  // A reply answers the newest message from the other side. A thread of only
  // our own mail goes back to whoever it was sent to.
  const replyTarget = latestInbound ?? detail;
  const replyTo = latestInbound ? latestInbound.fromEmail : detail.toEmails.join(", ");
  const own = thread.find((m) => m.id === detail.id)?.fromMe ?? false;

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    if (thread.length <= 3) return new Set(thread.map((m) => m.id));
    return new Set([thread[thread.length - 1].id, detail.id]);
  });
  const [showFolded, setShowFolded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<HTMLDivElement>(null);

  // Open on the newest message's first line, not the bottom of the conversation.
  // Frames above it grow as they load; the browser's scroll anchoring keeps it in place.
  const lastId = thread[thread.length - 1]?.id;
  useLayoutEffect(() => {
    if (!lastId) return;
    setExpanded((s) => (s.has(lastId) && s.has(detail.id) ? s : new Set(s).add(lastId).add(detail.id)));
    const scroller = scrollRef.current;
    const last = lastRef.current;
    if (scroller && last) scroller.scrollTop = thread.length > 1 ? Math.max(last.offsetTop - 16, 0) : 0;
  }, [lastId, thread.length, detail.id]);

  const toggle = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const folded = !showFolded && thread.length > FOLD_AFTER ? thread.length - 4 : 0;
  const visible = folded ? [thread[0], ...thread.slice(thread.length - 3)] : thread;
  const people = new Set(thread.filter((m) => !m.isInternal).map((m) => m.fromEmail.toLowerCase())).size;
  const mailCount = thread.filter((m) => !m.isInternal).length;

  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-5">
        <IconButton onClick={onBack} className="-ml-1 lg:hidden" aria-label="Back to list">
          <TbArrowLeft size={18} />
        </IconButton>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-[15px] font-semibold tracking-tight text-foreground">{detail.subject || "(No subject)"}</h2>
            {detail.campaign && (
              <span className="hidden shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20 sm:inline">
                {detail.campaign.name}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {`${mailCount} ${mailCount === 1 ? "message" : "messages"} · ${people} ${people === 1 ? "participant" : "participants"}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {folder === "archive" || folder === "trash" ? (
            <IconButton title={own ? "Move back to Sent" : "Move back to Inbox"} onClick={() => onMove(own ? "sent" : "inbox")}>
              <TbArrowBackUp size={17} />
            </IconButton>
          ) : (
            <IconButton title="Archive (E)" onClick={() => onMove("archive")}><TbArchive size={17} /></IconButton>
          )}
          {folder !== "trash" && <IconButton title="Delete (#)" onClick={() => onMove("trash")}><TbTrash size={17} /></IconButton>}
          <span className="mx-1 h-5 w-px bg-border" />
          <IconButton title="Details" active={infoOpen} onClick={onToggleInfo}><TbInfoCircle size={17} /></IconButton>
        </div>
      </div>

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        <div className="mx-auto flex max-w-[860px] flex-col gap-2.5">
          {visible.map((msg, i) => (
            <div key={msg.id} ref={msg.id === lastId ? lastRef : undefined}>
              {folded > 0 && i === 1 && (
                <button
                  onClick={() => setShowFolded(true)}
                  className="mb-2.5 flex w-full items-center gap-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="h-px flex-1 bg-border" />
                  <span className="rounded-full border bg-card px-3 py-1 shadow-xs">{`${folded} earlier ${folded === 1 ? "message" : "messages"}`}</span>
                  <span className="h-px flex-1 bg-border" />
                </button>
              )}
              <Message
                msg={msg}
                mine={isMine(msg, detail.ownerEmail)}
                expanded={!!msg.isInternal || expanded.has(msg.id)}
                onToggle={() => toggle(msg.id)}
              />
            </div>
          ))}
        </div>
      </div>

      <Composer
        key={detail.threadKey}
        detail={detail}
        replyTargetId={replyTarget.id}
        replyTo={replyTo}
        addresses={addresses}
        onSent={onReplied}
      />
    </>
  );
}

function Message({ msg, mine, expanded, onToggle }: { msg: Email; mine: boolean; expanded: boolean; onToggle: () => void }) {
  if (msg.isInternal) {
    return (
      <article className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 dark:border-amber-400/20 dark:bg-amber-400/[0.07]">
        <header className="flex items-center gap-2 text-xs">
          <TbNote size={14} className="shrink-0 text-amber-600 dark:text-amber-300" />
          <span className="font-semibold text-amber-900 dark:text-amber-200">{msg.fromName}</span>
          <span className="text-amber-700/80 dark:text-amber-300/70">added an internal note</span>
          <time className="ml-auto shrink-0 text-amber-700/70 dark:text-amber-300/60" title={fullTime(msg.sentAt)}>{stampTime(msg.sentAt)}</time>
        </header>
        {msg.body && <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-6 text-amber-950 dark:text-amber-100">{msg.body.replace(/<[^>]*>/g, "")}</p>}
        <Attachments atts={msg.attachments} />
      </article>
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-xl border bg-card/70 px-4 py-2.5 text-left shadow-xs transition-colors hover:bg-card"
      >
        <Avatar name={msg.fromName} seed={msg.fromEmail} src={msg.senderAvatarUrl} size="sm" />
        <span className="w-36 shrink-0 truncate text-[13px] font-medium text-foreground">{mine ? "You" : msg.fromName}</span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">{bodyPreview(msg.body)}</span>
        <time className="shrink-0 text-xs text-muted-foreground" title={fullTime(msg.sentAt)}>{stampTime(msg.sentAt)}</time>
      </button>
    );
  }

  const to = msg.toEmails.join(", ");
  return (
    <article className={cn("rounded-xl border bg-card shadow-xs", mine && "border-brand/15 bg-[color-mix(in_oklch,var(--card)_96%,var(--brand))]")}>
      <header className="flex cursor-pointer items-start gap-3 px-4 pt-3.5 sm:px-5" onClick={onToggle}>
        <Avatar name={msg.fromName} seed={msg.fromEmail} src={msg.senderAvatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="truncate text-[13.5px] font-semibold text-foreground">{msg.fromName}</span>
            <span className="hidden truncate text-xs text-muted-foreground sm:inline">{`<${msg.fromEmail}>`}</span>
            {mine && <span className="shrink-0 rounded-full bg-brand/10 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-brand">You</span>}
          </div>
          {to && <p className="truncate text-xs text-muted-foreground">{`to ${to}`}</p>}
        </div>
        <time className="shrink-0 pt-0.5 text-xs text-muted-foreground" title={fullTime(msg.sentAt)}>{stampTime(msg.sentAt)}</time>
      </header>
      <div className="px-4 pb-4 pt-3 sm:px-5">
        {msg.body ? <EmailBodyView body={msg.body} /> : <p className="text-sm italic text-muted-foreground">No message text.</p>}
        <Attachments atts={msg.attachments} />
      </div>
    </article>
  );
}

function Attachments({ atts }: { atts?: Att[] }) {
  if (!atts?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {atts.map((a) => <AttachmentView key={a.key} att={a} />)}
    </div>
  );
}

function Composer({ detail, replyTargetId, replyTo, addresses, onSent }: {
  detail: Email;
  replyTargetId: string;
  replyTo: string;
  addresses: SenderAddress[];
  onSent: () => Promise<void>;
}) {
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<Att[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  // Answer from the address the thread lives in: mail to hello@ is answered as hello@.
  const [replyFrom, setReplyFrom] = useState(() => addressFor(addresses, detail.ownerEmail)?.address ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!replyFrom && addresses.length) setReplyFrom(addressFor(addresses, detail.ownerEmail)?.address ?? "");
  }, [addresses, detail.ownerEmail, replyFrom]);

  const attachFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try { for (const f of Array.from(files)) { const a = await uploadAttachment(f); setPending((p) => [...p, a]); } }
    catch (err: any) { alertDialog(err.message || "Upload failed."); }
    finally { setUploading(false); }
  };

  const canSend = !sending && !uploading && (draft.trim().length > 0 || pending.length > 0);
  const send = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const target = mode === "note" ? detail.id : replyTargetId;
      await apiFetch(`/inbox/${target}/${mode === "note" ? "note" : "reply"}`, {
        method: "POST",
        body: JSON.stringify({ body: draft.trim(), attachments: pending, ...(mode === "reply" && replyFrom ? { from: replyFrom } : {}) }),
      });
      setDraft(""); setPending([]);
      await onSent();
    } catch (err: any) { alertDialog(err.message || "Could not send."); }
    finally { setSending(false); }
  };

  const note = mode === "note";
  return (
    <div className="shrink-0 border-t bg-foreground/[0.015] p-3">
      <div
        className={cn(
          "mx-auto max-w-[860px] rounded-xl border bg-background shadow-xs transition-[border-color,box-shadow] focus-within:shadow-sm",
          note
            ? "border-amber-300/80 bg-amber-50/70 focus-within:border-amber-400 focus-within:ring-[3px] focus-within:ring-amber-400/15 dark:border-amber-400/30 dark:bg-amber-400/[0.06]"
            : "focus-within:border-ring/60 focus-within:ring-[3px] focus-within:ring-ring/12"
        )}
      >
        <div className="flex flex-wrap items-center gap-2 px-2.5 pt-2.5">
          <div className="segmented !p-[2px]" role="tablist" aria-label="Message type">
            {(["reply", "note"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  mode === m ? "segment-active" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "reply" ? "Reply" : "Internal note"}
              </button>
            ))}
          </div>
          {note ? (
            <span className="truncate text-xs text-amber-700 dark:text-amber-300">Only your team sees notes. Never emailed.</span>
          ) : (
            <span className="min-w-0 truncate text-xs text-muted-foreground">{replyTo ? `To ${replyTo}` : ""}</span>
          )}
          {!note && addresses.length > 1 && (
            <div className="ml-auto min-w-0 max-w-[50%]">
              <FromSelect compact addresses={addresses} value={replyFrom} onChange={setReplyFrom} />
            </div>
          )}
        </div>
        {pending.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 pt-2">
            {pending.map((a, i) => (
              <span key={a.key} className="flex max-w-full items-center gap-1.5 rounded-full border bg-muted/60 py-0.5 pl-2.5 pr-1 text-xs text-foreground/80">
                <TbPaperclip size={11} className="shrink-0" /> <span className="truncate">{a.name}</span>
                <button onClick={() => setPending(pending.filter((_, j) => j !== i))} className="rounded-full p-0.5 hover:bg-foreground/10" aria-label={`Remove ${a.name}`}><TbX size={12} /></button>
              </span>
            ))}
          </div>
        )}
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
          placeholder={uploading ? "Uploading attachment…" : note ? "Add an internal note…" : "Write a reply…"}
          className="field-sizing-content block max-h-52 min-h-[64px] w-full resize-none bg-transparent px-3 py-2.5 text-[13.5px] leading-6 text-foreground outline-none placeholder:text-muted-foreground/80"
        />
        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <IconButton onClick={() => fileRef.current?.click()} disabled={uploading} title="Attach images, audio, video or files">
            <TbPaperclip size={17} />
          </IconButton>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { attachFiles(e.target.files); e.target.value = ""; }} />
          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] text-muted-foreground md:inline">Enter to send · Shift+Enter for a new line</span>
            <Button
              size="sm"
              onClick={send}
              disabled={!canSend}
              className={cn(note && "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400")}
            >
              {note ? <TbNote /> : <TbSend2 />}
              {sending ? "Sending…" : note ? "Add note" : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Who the conversation is with, and when it happened. */
export function InboxInfo({ detail, onClose, onCompose }: { detail: Email; onClose?: () => void; onCompose: (to: string) => void }) {
  const thread = detail.thread ?? [detail];
  const contact = thread.find((m) => !isMine(m, detail.ownerEmail)) ?? detail;
  const contactEmail = contact.fromMe ? contact.toEmails[0] ?? contact.fromEmail : contact.fromEmail;
  const contactName = contact.fromMe ? contactEmail : contact.fromName;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contactEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked: nothing to undo */ }
  };

  const mails = thread.filter((m) => !m.isInternal);
  const notes = thread.length - mails.length;
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
      {onClose && (
        <IconButton onClick={onClose} className="-mr-1.5 -mt-1.5 mb-1 self-end" aria-label="Close details"><TbX size={18} /></IconButton>
      )}
      <div className="flex flex-col items-center text-center">
        <Avatar name={contactName} seed={contactEmail} size="lg" />
        <p className="mt-3 max-w-full truncate text-[15px] font-semibold text-foreground">{contactName}</p>
        <p className="max-w-full break-all text-xs text-muted-foreground">{contactEmail}</p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" onClick={copy}>{copied ? <TbCheck /> : <TbCopy />}{copied ? "Copied" : "Copy"}</Button>
          <Button variant="outline" size="sm" onClick={() => onCompose(contactEmail)}><TbPencil />Email</Button>
        </div>
      </div>

      <dl className="mt-6 space-y-3.5 border-t pt-5 text-sm">
        <InfoRow label="Mailbox" value={detail.ownerEmail} />
        {detail.toEmails.length > 0 && <InfoRow label="To" value={detail.toEmails.join(", ")} />}
        {detail.ccEmails?.length > 0 && <InfoRow label="Cc" value={detail.ccEmails.join(", ")} />}
        {detail.campaign && <InfoRow label="Campaign" value={detail.campaign.name} />}
      </dl>

      <div className="mt-5 border-t pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Conversation</p>
        <dl className="mt-3 space-y-3.5 text-sm">
          <InfoRow label="Started" value={thread[0] ? fullTime(thread[0].sentAt) : "—"} />
          <InfoRow label="Latest" value={thread.length ? fullTime(thread[thread.length - 1].sentAt) : "—"} />
          <InfoRow label="Activity" value={`${mails.length} ${mails.length === 1 ? "message" : "messages"} · ${notes} ${notes === 1 ? "note" : "notes"}`} />
        </dl>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-foreground">{value}</dd>
    </div>
  );
}
