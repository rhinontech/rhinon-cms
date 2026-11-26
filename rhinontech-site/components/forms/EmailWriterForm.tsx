"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Check, Clipboard, LoaderCircle, Sparkles } from "lucide-react";
import { API_URL, links } from "@/components/site";
import { track, trackThen } from "@/lib/analytics";

const PURPOSES = [
  ["cold-outreach", "First outreach"],
  ["follow-up", "Follow-up"],
  ["meeting-request", "Request a meeting"],
  ["reply", "Reply to a message"],
  ["thank-you", "Say thank you"],
] as const;
const TONES = [
  ["friendly", "Friendly"],
  ["professional", "Professional"],
  ["direct", "Direct"],
  ["warm", "Warm"],
] as const;
const LENGTHS = [
  ["short", "Short · 60–110 words"],
  ["medium", "Medium · 110–180 words"],
] as const;

type WriterResult = { subject: string; body: string };
type FormState = {
  purpose: (typeof PURPOSES)[number][0];
  tone: (typeof TONES)[number][0];
  length: (typeof LENGTHS)[number][0];
  recipient: string;
  context: string;
  senderName: string;
};

const field =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[14.5px] outline-none transition focus:border-violet focus:ring-4 focus:ring-violet/10";
const label = "mb-1.5 block text-[13px] font-semibold text-ink-soft";

function isOption<T extends readonly (readonly [string, string])[]>(options: T, value: string): value is T[number][0] {
  return options.some(([option]) => option === value);
}

function isWriterResult(value: unknown): value is WriterResult {
  if (typeof value !== "object" || value === null) return false;
  return "subject" in value && typeof value.subject === "string"
    && "body" in value && typeof value.body === "string" && value.body.trim().length > 0;
}

function messageFrom(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  return "message" in value && typeof value.message === "string" ? value.message : undefined;
}

export function EmailWriterForm() {
  const [form, setForm] = useState<FormState>({
    purpose: "cold-outreach",
    tone: "friendly",
    length: "short",
    recipient: "",
    context: "",
    senderName: "",
  });
  const [result, setResult] = useState<WriterResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const setText =
    (key: "recipient" | "context" | "senderName") =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setCopyStatus("");
    try {
      const response = await fetch(`${API_URL}/public/tools/email-writer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          recipient: form.recipient.trim(),
          context: form.context.trim(),
          senderName: form.senderName.trim(),
        }),
      });
      const payload: unknown = await response.json().catch(() => undefined);
      if (!response.ok) {
        throw new Error(messageFrom(payload) || "We couldn't write that email. Please try again.");
      }
      if (!isWriterResult(payload)) {
        throw new Error("The email writer returned an incomplete draft. Please try again.");
      }
      setResult(payload);
      track("tool_used", { tool: "ai_email_writer" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't write that email. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const copyResult = async () => {
    if (!result) return;
    setCopyStatus("");
    try {
      await navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`);
      setCopyStatus("Email copied.");
    } catch {
      setCopyStatus("Copy isn't available here. Select the draft and copy it.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <form onSubmit={submit} aria-busy={busy} className="window space-y-5 p-5 sm:p-7">
        {error && <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-700">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="writer-purpose" className={label}>What do you need?</label>
            <select id="writer-purpose" value={form.purpose} onChange={(event) => {
              const purpose = event.target.value;
              if (isOption(PURPOSES, purpose)) setForm((current) => ({ ...current, purpose }));
            }} className={field}>
              {PURPOSES.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="writer-tone" className={label}>Tone</label>
            <select id="writer-tone" value={form.tone} onChange={(event) => {
              const tone = event.target.value;
              if (isOption(TONES, tone)) setForm((current) => ({ ...current, tone }));
            }} className={field}>
              {TONES.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="writer-length" className={label}>Length</label>
            <select id="writer-length" value={form.length} onChange={(event) => {
              const length = event.target.value;
              if (isOption(LENGTHS, length)) setForm((current) => ({ ...current, length }));
            }} className={field}>
              {LENGTHS.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="writer-recipient" className={label}>Who are you writing to? *</label>
          <input
            id="writer-recipient"
            required
            minLength={2}
            maxLength={160}
            value={form.recipient}
            onChange={setText("recipient")}
            className={field}
            placeholder="e.g. A marketing lead at a dental clinic"
          />
        </div>
        <div>
          <label htmlFor="writer-context" className={label}>What should the email say? *</label>
          <textarea
            id="writer-context"
            required
            minLength={10}
            maxLength={800}
            rows={5}
            value={form.context}
            onChange={setText("context")}
            className={`${field} resize-y`}
            placeholder="Share the reason for writing, a relevant detail, and what you'd like them to do next."
          />
          <p className="mt-1.5 text-[12px] text-muted">Don’t include confidential or sensitive information.</p>
        </div>
        <div>
          <label htmlFor="writer-sender" className={label}>Your name <span className="font-normal">(optional)</span></label>
          <input
            id="writer-sender"
            maxLength={60}
            value={form.senderName}
            onChange={setText("senderName")}
            className={field}
            placeholder="Leave blank to use a name placeholder"
          />
        </div>
        <button type="submit" disabled={busy} className="btn btn-primary w-full justify-center gap-2 disabled:cursor-wait disabled:opacity-60">
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {busy ? "Writing your email…" : "Write my email"}
        </button>
        <p className="text-center text-[12px] text-muted">Free · 3 drafts a day · No account needed</p>
      </form>

      <section aria-live="polite" aria-label="Your email draft" className="window min-h-[360px] p-5 sm:p-7">
        {result ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Your draft</p>
                <h2 className="font-display mt-2 text-[22px] font-semibold">Review before you send</h2>
              </div>
              <button type="button" onClick={copyResult} className="btn btn-soft shrink-0 gap-2" aria-label="Copy email">
                {copyStatus === "Email copied." ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                Copy
              </button>
            </div>
            <div className="mt-6 border-b border-line pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Subject</p>
              <p className="mt-1 text-[15px] font-medium">{result.subject || "No subject generated"}</p>
            </div>
            <p className="mt-5 whitespace-pre-wrap text-[14.5px] leading-7 text-ink-soft">{result.body}</p>
            {copyStatus && <p role="status" className="mt-4 text-[13px] text-ink-soft">{copyStatus}</p>}
            <div className="mt-7 border-t border-line pt-5">
              <p className="text-[14px] font-semibold">Want to send it as a sequence?</p>
              <a
                href={links.signup}
                onClick={(event) => {
                  event.preventDefault();
                  trackThen("tool_signup", { tool: "ai_email_writer" }, () => window.location.assign(links.signup));
                }}
                className="btn btn-primary mt-3 w-full justify-center"
              >
                Try Rhinon Outreach free
              </a>
            </div>
          </>
        ) : (
          <div className="flex min-h-[310px] flex-col items-center justify-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet/10 text-violet">
              <Sparkles className="h-5 w-5" />
            </span>
            <h2 className="font-display mt-5 text-[22px] font-semibold">Your draft will appear here</h2>
            <p className="mt-2 max-w-[300px] text-[14px] leading-6 text-ink-soft">Tell us who it’s for and what you want to say. You’ll review the draft before copying it.</p>
          </div>
        )}
      </section>
    </div>
  );
}
