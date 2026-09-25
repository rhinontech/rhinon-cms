"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Copy, Hourglass, Loader2, X } from "lucide-react";
import { checkGuestStatus, registerForEvent, type RegistrationResult } from "@/services/eventService";

export interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  eventDate?: string;
  eventTime?: string;
  eventId?: string;
  eventSlug: string;
  /** Code from a ?ref= link, if the visitor arrived through one. */
  referralCode?: string;
}

const field =
  "w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-[14.5px] text-[#0B1B3D] placeholder:text-[#94A3B8] outline-none transition focus:border-[#0052FF] focus:ring-4 focus:ring-[#0052FF]/10";
const label = "block text-[12.5px] font-semibold text-[#334155] mb-1.5";

export function EventRegistrationModal({
  isOpen,
  onClose,
  eventTitle,
  eventDate,
  eventTime,
  eventId,
  eventSlug,
  referralCode = "",
}: EventRegistrationModalProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    userType: "Professional" as "Professional" | "Student",
    role: "",
    collegeName: "",
    graduationYear: "",
    linkedin: "",
    referralCode,
    expectation: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState<string | null>(null);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => firstField.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Please enter your name and a valid email address.");
      return;
    }
    setSubmitting(true);
    const res = await registerForEvent({
      eventId,
      eventSlug,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      userType: form.userType,
      role: form.userType === "Professional" ? form.role.trim() || undefined : "Student",
      collegeName: form.userType === "Student" ? form.collegeName.trim() || undefined : undefined,
      graduationYear: form.userType === "Student" ? form.graduationYear.trim() || undefined : undefined,
      linkedin: form.linkedin.trim() || undefined,
      referralCode: form.referralCode.trim() || undefined,
      expectation: form.expectation.trim() || undefined,
    });
    setSubmitting(false);
    if (res.success) setResult(res);
    else setError(res.message || "We couldn't register you. Please try again.");
  };

  const pageUrl = result?.token ? `/events/${eventSlug}/registered?token=${encodeURIComponent(result.token)}` : null;
  const shareUrl =
    result?.referralCode && typeof window !== "undefined"
      ? `${window.location.origin}/events/${eventSlug}?ref=${result.referralCode}`
      : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-title"
      className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center overflow-y-auto bg-[#0B1B3D]/55 p-4 backdrop-blur-sm font-[family-name:var(--font-plus-jakarta)]"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="relative my-6 w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-[0_40px_100px_-30px_rgba(11,27,61,0.6)]">
        <div className="h-1.5 bg-gradient-to-r from-[#0052FF] via-[#0077FF] to-[#00C2FF]" aria-hidden />
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-5 grid size-9 place-items-center rounded-full text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0B1B3D]">
          <X className="size-4" />
        </button>

        {result ? (
          <div className="px-7 py-9 sm:px-10 text-center">
            <span className={`mx-auto grid size-14 place-items-center rounded-2xl ${result.guestType === "Approved" ? "bg-[#ECFDF3] text-[#16A34A]" : "bg-[#FFF7ED] text-[#D97706]"}`}>
              {result.guestType === "Approved" ? <CheckCircle2 className="size-7" /> : <Hourglass className="size-7" />}
            </span>
            <h2 id="register-title" className="mt-5 text-2xl font-extrabold tracking-tight text-[#0B1B3D]">
              {result.alreadyRegistered
                ? "You're already registered"
                : result.guestType === "Approved"
                  ? "You're registered"
                  : "You're on the waitlist"}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-[14.5px] leading-relaxed text-[#475569]">
              {result.alreadyRegistered
                ? `Your status for ${eventTitle}: ${result.guestType === "Waitlist" ? "on the waitlist" : result.guestType?.toLowerCase()}.`
                : result.guestType === "Approved"
                  ? `A confirmation with a calendar invite is on its way to ${form.email}.`
                  : `We review every registration. We'll email ${form.email} the moment you're approved.`}
            </p>
            <div className="mt-7 flex flex-col gap-3">
              {pageUrl ? (
                <Link href={pageUrl} className="inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#0052FF] px-6 py-3.5 text-[13px] font-bold uppercase tracking-wider text-white hover:bg-[#0043CC]">
                  Open your registration <ArrowRight className="size-4" />
                </Link>
              ) : null}
              {shareUrl ? (
                <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-left">
                  <p className="text-[13px] font-semibold text-[#0B1B3D]">Bring a friend</p>
                  <p className="mt-0.5 text-[12.5px] text-[#64748B]">Registrations through your link are credited to you.</p>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[12.5px] text-[#334155]">{shareUrl}</code>
                    <button type="button" onClick={() => { navigator.clipboard?.writeText(shareUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[12.5px] font-semibold text-[#0B1B3D] hover:border-[#0052FF]">
                      {copied ? <Check className="size-3.5 text-[#16A34A]" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              ) : null}
              <button type="button" onClick={onClose} className="text-[13px] font-semibold text-[#64748B] hover:text-[#0B1B3D]">Close</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 py-7 sm:px-9 sm:py-9" noValidate>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0052FF]">Register · Free</p>
            <h2 id="register-title" className="mt-2 pr-8 text-[22px] font-extrabold leading-snug tracking-tight text-[#0B1B3D]">{eventTitle}</h2>
            {eventDate ? <p className="mt-1 text-[13.5px] text-[#64748B]">{eventDate}{eventTime ? ` · ${eventTime}` : ""}</p> : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={label} htmlFor="rg-name">Full name *</label>
                <input ref={firstField} id="rg-name" className={field} value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" required />
              </div>
              <div>
                <label className={label} htmlFor="rg-email">Email *</label>
                <input id="rg-email" type="email" className={field} value={form.email} autoComplete="email" required
                  onChange={(e) => { set("email", e.target.value); setExisting(null); }}
                  onBlur={async () => {
                    const email = form.email.trim();
                    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setExisting(await checkGuestStatus(eventSlug, email));
                  }} />
              </div>
              <div>
                <label className={label} htmlFor="rg-phone">Phone</label>
                <input id="rg-phone" type="tel" className={field} value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" placeholder="+91" />
              </div>
            </div>
            {existing ? (
              <p className="mt-3 rounded-xl bg-[#EBF3FF] px-3.5 py-2.5 text-[13px] text-[#0B1B3D]">
                This email is already registered ({existing === "Waitlist" ? "on the waitlist" : existing.toLowerCase()}). Submit again to get your registration link back.
              </p>
            ) : null}

            <div className="mt-5">
              <span className={label}>I&apos;m joining as</span>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F1F5F9] p-1" role="radiogroup" aria-label="Joining as">
                {(["Professional", "Student"] as const).map((type) => (
                  <button key={type} type="button" role="radio" aria-checked={form.userType === type} onClick={() => set("userType", type)}
                    className={`rounded-lg py-2 text-[13.5px] font-semibold transition ${form.userType === type ? "bg-white text-[#0B1B3D] shadow-sm" : "text-[#64748B] hover:text-[#0B1B3D]"}`}>
                    {type === "Professional" ? "A professional" : "A student"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {form.userType === "Professional" ? (
                <div className="sm:col-span-2">
                  <label className={label} htmlFor="rg-role">Role & organisation</label>
                  <input id="rg-role" className={field} value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="e.g. Maths teacher, Delhi Public School" />
                </div>
              ) : (
                <>
                  <div>
                    <label className={label} htmlFor="rg-college">College</label>
                    <input id="rg-college" className={field} value={form.collegeName} onChange={(e) => set("collegeName", e.target.value)} />
                  </div>
                  <div>
                    <label className={label} htmlFor="rg-grad">Graduation year</label>
                    <input id="rg-grad" inputMode="numeric" className={field} value={form.graduationYear} onChange={(e) => set("graduationYear", e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} placeholder="2027" />
                  </div>
                </>
              )}
              <div>
                <label className={label} htmlFor="rg-linkedin">LinkedIn</label>
                <input id="rg-linkedin" className={field} value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="linkedin.com/in/…" />
              </div>
              <div>
                <label className={label} htmlFor="rg-ref">Referral code</label>
                <input id="rg-ref" className={`${field} uppercase`} value={form.referralCode} onChange={(e) => set("referralCode", e.target.value.toUpperCase())} placeholder="Optional" />
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="rg-exp">What do you hope to take away?</label>
                <textarea id="rg-exp" rows={2} className={`${field} resize-none`} value={form.expectation} onChange={(e) => set("expectation", e.target.value)} placeholder="Optional — it helps the host tailor the session" />
              </div>
            </div>

            {error ? <p role="alert" className="mt-4 rounded-xl bg-[#FEF2F2] px-3.5 py-2.5 text-[13px] text-[#B91C1C]">{error}</p> : null}

            <button type="submit" disabled={submitting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[4px] bg-[#0052FF] px-6 py-3.5 text-[13px] font-bold uppercase tracking-wider text-white shadow-[0_10px_24px_-10px_rgba(0,82,255,0.6)] transition hover:bg-[#0043CC] disabled:opacity-70">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null} Register
            </button>
            <p className="mt-3 text-center text-[12px] text-[#94A3B8]">We&apos;ll only email you about this event.</p>
          </form>
        )}
      </div>
    </div>
  );
}

export default EventRegistrationModal;
