"use client";

import { useEffect, useRef, useState } from "react";
import { TbPaperclip, TbSend2, TbX } from "react-icons/tb";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, FromSelect, uploadAttachment, type Att, type SenderAddress } from "./inboxShared";

const field =
  "w-full bg-transparent px-0 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/80";

export function ComposeModal({ onClose, onSent, addresses, defaultFrom, initialTo = "" }: {
  onClose: () => void;
  onSent: () => void;
  addresses: SenderAddress[];
  defaultFrom: string;
  initialTo?: string;
}) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(initialTo ? `${initialTo}, ` : "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [contacts, setContacts] = useState<Array<{ fullName: string; companyEmail: string }>>([]);
  const [toFocused, setToFocused] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch<Array<{ fullName: string; companyEmail: string }>>("/inbox/contacts").then(setContacts).catch(() => { });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

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
        body: JSON.stringify({ from: from || undefined, toEmails: to.split(",").map((t) => t.trim()).filter(Boolean), subject, body, attachments }),
      });
      onSent(); onClose();
    } catch (err: any) { setError(err.message || "Could not send."); } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center glass-overlay p-0 sm:items-center sm:p-4" onClick={() => !busy && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New message"
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border bg-popover shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-13 shrink-0 items-center justify-between border-b px-5 py-3">
          <p className="text-[15px] font-semibold tracking-tight">New message</p>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground" aria-label="Close">
            <TbX size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5">
            {addresses.length > 1 && (
              <div className="border-b py-2">
                <FromSelect compact addresses={addresses} value={from} onChange={setFrom} />
              </div>
            )}
            <div className="relative flex items-center gap-3 border-b">
              <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">To</span>
              <input
                className={field}
                placeholder="name@company.com, …"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                onFocus={() => setToFocused(true)}
                onBlur={() => setTimeout(() => setToFocused(false), 150)}
                autoFocus={!initialTo}
                required
              />
              {suggestions.length > 0 && (
                <div className="absolute left-14 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg">
                  {suggestions.map((c) => (
                    <button
                      key={c.companyEmail}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); pickContact(c.companyEmail); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted"
                    >
                      <Avatar name={c.fullName} seed={c.companyEmail} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">{c.fullName}</span>
                        <span className="block truncate text-xs text-muted-foreground">{c.companyEmail}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 border-b">
              <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">Subject</span>
              <input className={field} placeholder="What is this about?" value={subject} onChange={(e) => setSubject(e.target.value)} autoFocus={!!initialTo} required />
            </div>
            <textarea
              className="block min-h-48 w-full resize-none bg-transparent py-3.5 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground/80"
              placeholder="Write your message…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
            {files.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-3">
                {files.map((f, i) => (
                  <span key={i} className="flex max-w-full items-center gap-1.5 rounded-full border bg-muted/60 py-1 pl-2.5 pr-1.5 text-xs text-foreground/80">
                    <TbPaperclip size={12} className="shrink-0" />
                    <span className="truncate">{f.name}</span>
                    <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="rounded-full p-0.5 hover:bg-foreground/10" aria-label={`Remove ${f.name}`}>
                      <TbX size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          {error && <p className="px-5 pb-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-foreground/[0.02] px-4 py-3">
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground">
              <TbPaperclip size={15} /> Attach
            </button>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { setFiles([...files, ...Array.from(e.target.files ?? [])]); e.target.value = ""; }} />
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={busy}>Discard</Button>
              <Button type="submit" size="sm" disabled={busy}>
                <TbSend2 /> {busy ? "Sending…" : "Send"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
