"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { API_URL, BRAND_SLUG } from "@/components/site";

/* The same enquiry form as rhinonlabs.com/contact-us, posting to the same lead API. */

const TOPICS = ["A product question", "Pricing", "The AI chatbot", "A custom integration", "Something else"];
const field = "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[14.5px] outline-none transition focus:border-violet focus:ring-4 focus:ring-violet/10";
const label = "mb-1.5 block text-[13px] font-semibold text-ink-soft";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", topic: TOPICS[0], message: "", hp: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.hp) return setSent(true); // a bot filled the hidden field: look like success, send nothing
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/public/web-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), whatsapp: form.phone.trim(), company: form.company.trim(), projectType: form.topic, message: form.message.trim(), site: BRAND_SLUG }),
      });
      if (res.status === 429) throw new Error("Too many messages from this connection. Please try again in a little while.");
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "We could not send that. Please try again.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not send that. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (sent)
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
        <span className="pop-in flex h-16 w-16 items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg,#10c98f,#2cd3ff)" }}><Check className="h-8 w-8" strokeWidth={3} /></span>
        <h2 className="font-display mt-6 text-[30px] font-semibold">Message sent</h2>
        <p className="mt-3 max-w-[340px] text-[15px] leading-7 text-ink-soft">Thanks for writing. We read every message and will reply by email.</p>
        <Link href="/demo" className="btn btn-ghost mt-6">Or book a demo</Link>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="c-name" className={label}>Name *</label><input id="c-name" required value={form.name} onChange={set("name")} className={field} autoComplete="name" /></div>
        <div><label htmlFor="c-email" className={label}>Work email *</label><input id="c-email" type="email" required value={form.email} onChange={set("email")} className={field} autoComplete="email" /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="c-phone" className={label}>WhatsApp or phone</label><input id="c-phone" type="tel" value={form.phone} onChange={set("phone")} className={field} autoComplete="tel" /></div>
        <div><label htmlFor="c-company" className={label}>Company</label><input id="c-company" value={form.company} onChange={set("company")} className={field} autoComplete="organization" /></div>
      </div>
      <div><label htmlFor="c-topic" className={label}>What is this about?</label><select id="c-topic" value={form.topic} onChange={set("topic")} className={field}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select></div>
      <div><label htmlFor="c-msg" className={label}>Message *</label><textarea id="c-msg" required rows={5} value={form.message} onChange={set("message")} className={`${field} resize-none`} /></div>
      <input tabIndex={-1} autoComplete="off" aria-hidden value={form.hp} onChange={set("hp")} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <button type="submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-60">{busy ? "Sending…" : "Send message"}</button>
    </form>
  );
}
