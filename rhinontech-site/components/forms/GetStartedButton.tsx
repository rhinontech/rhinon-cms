"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { BRAND_SLUG, PUBLIC_API, links } from "@/components/site";

/*
 * "Get started free" that captures the visitor as a CRM lead before sending them to sign up.
 * Posts to the same /web-leads API as the contact form. The Lead model requires name, email and
 * company, so all three are required here; phone is optional.
 */

const field = "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[14.5px] outline-none transition focus:border-violet focus:ring-4 focus:ring-violet/10";
const label = "mb-1.5 block text-[13px] font-semibold text-ink-soft";

type Variant = "primary" | "ghost" | "glass" | "ink" | "soft";

export function GetStartedButton({
  children = "Get started free",
  variant = "ink",
  placement,
  className = "",
}: {
  children?: React.ReactNode;
  variant?: Variant;
  /** Where on the site the button sits, recorded on the lead (e.g. "Home hero"). */
  placement: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", hp: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const firstField = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstField.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.hp) return window.location.assign(links.signup); // a bot filled the hidden field: send nothing
    setBusy(true);
    try {
      const res = await fetch(`${PUBLIC_API}/web-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          company: form.company.trim(),
          whatsapp: form.phone.trim(),
          projectType: "Get started free (signup)",
          message: `Clicked "Get started free" (${placement}) on rhinontech.com and was sent to sign up.`,
          site: BRAND_SLUG,
        }),
      });
      if (res.status === 429) throw new Error("Too many requests from this connection. Please try again in a little while.");
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "We could not save that. Please try again.");
      window.location.assign(links.signup);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not save that. Please try again.");
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`btn btn-${variant} group ${className}`}>
        {children}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gs-title"
          className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0b0b14]/50 p-4 backdrop-blur-sm sm:items-center"
          onMouseDown={(e) => e.target === e.currentTarget && !busy && setOpen(false)}
        >
          <div className="relative w-full max-w-[460px] rounded-2xl bg-white p-6 text-left shadow-[0_40px_90px_-30px_rgb(11_11_20_/_0.5)] sm:p-8">
            <button
              type="button"
              aria-label="Close"
              disabled={busy}
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted transition hover:bg-black/5 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 id="gs-title" className="font-display text-[26px] font-semibold leading-tight text-ink">Create your free workspace</h2>
            <p className="mt-2 text-[14.5px] leading-6 text-ink-soft">Tell us a little about you, then we will take you to sign up.</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {error && <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-700">{error}</p>}
              <div><label htmlFor="gs-name" className={label}>Full name *</label><input ref={firstField} id="gs-name" required maxLength={200} value={form.name} onChange={set("name")} className={field} autoComplete="name" /></div>
              <div><label htmlFor="gs-email" className={label}>Work email *</label><input id="gs-email" type="email" required maxLength={320} value={form.email} onChange={set("email")} className={field} autoComplete="email" /></div>
              <div><label htmlFor="gs-company" className={label}>Company *</label><input id="gs-company" required maxLength={200} value={form.company} onChange={set("company")} className={field} autoComplete="organization" /></div>
              <div><label htmlFor="gs-phone" className={label}>WhatsApp or phone</label><input id="gs-phone" type="tel" maxLength={40} value={form.phone} onChange={set("phone")} className={field} autoComplete="tel" /></div>
              <input tabIndex={-1} autoComplete="off" aria-hidden value={form.hp} onChange={set("hp")} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
              <button type="submit" disabled={busy} className="btn btn-ink w-full disabled:opacity-60">{busy ? "Taking you to sign up…" : "Continue to sign up"}</button>
              <p className="text-center text-[12.5px] text-muted">Free forever. No credit card.</p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
