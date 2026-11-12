"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, Globe, Video } from "lucide-react";
import { BRAND_SLUG, PUBLIC_API } from "@/components/site";
import { Logo } from "@/components/ui";

/* The same booking flow as rhinonlabs.com/schedule-call, against the same API and calendar. */

type Slot = { startTime: string; endTime: string; available: boolean };
type Booked = { booked: boolean; meetLink: string | null };

const INTERESTS = ["CRM", "Outreach", "Inbox", "AI Chatbot", "Work", "HR and payroll", "Something else"];
const TEAM_SIZES = ["Just me", "2 to 10", "11 to 50", "51 to 100", "100+"];
const CODES = ["+91", "+1", "+44", "+61", "+49", "+65"];
const MAX_MONTHS_AHEAD = 3;

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const clock = (iso: string, timeZone: string, h24: boolean) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: h24 ? "2-digit" : "numeric", minute: "2-digit", hour12: !h24, timeZone });

const field = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14.5px] outline-none transition focus:border-violet focus:ring-4 focus:ring-violet/10";
const label = "mb-1.5 block text-[13px] font-semibold text-ink-soft";

export function Scheduler() {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [day, setDay] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [h24, setH24] = useState(false);
  const [tz, setTz] = useState("Asia/Kolkata");
  const [code, setCode] = useState("+91");
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", website: "", teamSize: "", message: "" });
  const [interests, setInterests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Booked | null>(null);

  useEffect(() => {
    try { setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata"); } catch { /* keep the default */ }
  }, []);

  const loadSlots = async (date: string, signal?: AbortSignal) => {
    const res = await fetch(`${PUBLIC_API}/schedule-call/availability?date=${encodeURIComponent(date)}`, { cache: "no-store", signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.message || "load"), { code: data.code });
    return data.slots as Slot[];
  };

  useEffect(() => {
    if (!day) return;
    const ctl = new AbortController();
    setLoading(true);
    setSlotsError("");
    loadSlots(day, ctl.signal)
      .then(setSlots)
      .catch((e: Error & { code?: string }) => {
        if (ctl.signal.aborted) return;
        setSlots([]);
        setSlotsError(e.code === "CALENDAR_UNAVAILABLE" ? "Booking is temporarily unavailable. Please try again shortly." : "We could not load times for that day. Please try another.");
      })
      .finally(() => { if (!ctl.signal.aborted) setLoading(false); });
    return () => ctl.abort();
  }, [day]);

  const first = new Date(view.y, view.m, 1).getDay();
  const count = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  const isOff = (d: number) => {
    const date = new Date(view.y, view.m, d);
    return date < today || date.getDay() === 0 || date.getDay() === 6;
  };
  const atStart = view.y === today.getFullYear() && view.m === today.getMonth();
  const atEnd = view.y * 12 + view.m >= today.getFullYear() * 12 + today.getMonth() + MAX_MONTHS_AHEAD;
  const shift = (by: number) => setView((v) => { const d = new Date(v.y, v.m + by, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const pretty = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (i: string) => setInterests((x) => (x.includes(i) ? x.filter((v) => v !== i) : [...x, i]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slot) return;
    setSubmitting(true);
    setError("");
    try {
      const message = [interests.length ? `Interested in: ${interests.join(", ")}.` : "", form.message.trim()].filter(Boolean).join(" ");
      const res = await fetch(`${PUBLIC_API}/schedule-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: BRAND_SLUG,
          name: form.name.trim(), email: form.email.trim(), phone: `${code} ${form.phone}`.trim(), company: form.company.trim(),
          website: form.website.trim(), teamSize: form.teamSize, message, startTime: slot.startTime, timezone: tz,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 || data.code === "SLOT_TAKEN") {
        setSlot(null);
        setStep(1);
        if (day) setSlots(await loadSlots(day).catch(() => []));
        setSlotsError("That time was just taken. Please choose another.");
        return;
      }
      if (!res.ok) throw new Error(data.message || "Something went wrong. Please try again.");
      setDone({ booked: data.booked, meetLink: data.booking?.meetLink ?? null });
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="window mx-auto grid w-full max-w-[1080px] overflow-hidden !rounded-[28px] md:grid-cols-[320px_1fr]">
      <aside className="relative overflow-hidden bg-night p-7 text-white md:p-9">
        <span aria-hidden className="blob -left-16 -top-16 h-60 w-60" style={{ background: "#7c5cff", opacity: 0.45 }} />
        <span aria-hidden className="blob -bottom-20 -right-16 h-60 w-60 [animation-delay:-9s]" style={{ background: "#2f5bff", opacity: 0.4 }} />
        <div className="relative">
          <Logo light height={34} />
          <h1 className="font-display mt-9 text-[30px] font-semibold leading-[1.08]">{step === 3 ? "You are booked." : "Book a demo"}</h1>
          <p className="mt-3 text-[14.5px] leading-6 text-white/65">A walk through the workspace, built around your team. Bring your questions.</p>
          <ul className="mt-7 space-y-3.5 border-t border-white/10 pt-6 text-[14px] text-white/75">
            {slot && day && <li className="flex gap-3"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#b9a6ff]" /><span><b className="block font-semibold text-white">{pretty(day)}</b>{clock(slot.startTime, tz, h24)} to {clock(slot.endTime, tz, h24)}</span></li>}
            <li className="flex gap-3"><Clock className="h-4 w-4 shrink-0 text-[#b9a6ff]" />30 minutes</li>
            <li className="flex gap-3"><Video className="h-4 w-4 shrink-0 text-[#b9a6ff]" />Google Meet</li>
            <li className="flex gap-3"><Globe className="h-4 w-4 shrink-0 text-[#b9a6ff]" /><span className="truncate">{tz}</span></li>
          </ul>
        </div>
      </aside>

      <section className="bg-white p-6 md:p-9">
        {step === 1 && (
          <div className="grid gap-8 lg:grid-cols-[1fr_230px]">
            <div>
              <div className="mb-5 flex items-center justify-between">
                <b className="font-display text-[22px] font-semibold">{new Date(view.y, view.m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</b>
                <span className="flex gap-2">
                  <button type="button" aria-label="Previous month" disabled={atStart} onClick={() => shift(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-line hover:bg-soft disabled:pointer-events-none disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                  <button type="button" aria-label="Next month" disabled={atEnd} onClick={() => shift(1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-line hover:bg-soft disabled:pointer-events-none disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                </span>
              </div>
              <div className="mb-2 grid grid-cols-7 gap-1.5 text-center font-mono text-[10.5px] uppercase tracking-wider text-muted">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <span key={d}>{d}</span>)}</div>
              <div className="grid grid-cols-7 gap-1.5">
                {cells.map((d, i) => {
                  if (d === null) return <i key={`b${i}`} />;
                  const date = ymd(view.y, view.m, d);
                  const off = isOff(d);
                  const on = day === date;
                  return (
                    <button key={d} type="button" disabled={off} onClick={() => { setDay(date); setSlot(null); }} className={`aspect-square rounded-xl text-[14px] font-semibold transition ${on ? "scale-105 text-white shadow-[0_10px_24px_-8px_rgb(91_92_255_/_0.8)]" : off ? "text-line" : "bg-soft text-ink hover:bg-violet/10 hover:text-violet"}`} style={on ? { background: "linear-gradient(135deg,#2f5bff,#7c5cff)" } : undefined}>{d}</button>
                  );
                })}
              </div>
              <p className="mt-4 text-[12.5px] text-muted">Calls run Monday to Friday, 9 am to 6 pm India time.</p>
            </div>
            <div className="min-h-[300px] border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
              <div className="mb-3 flex items-center justify-between">
                <b className="text-[14px] font-semibold">{day ? pretty(day) : "Pick a day"}</b>
                {day && <span className="flex rounded-lg bg-soft p-0.5 text-[11px] font-bold">{["12h", "24h"].map((l) => <button key={l} type="button" onClick={() => setH24(l === "24h")} className={`rounded-md px-2 py-1 ${(l === "24h") === h24 ? "bg-white shadow-sm" : "text-muted"}`}>{l}</button>)}</span>}
              </div>
              {slotsError && <p role="alert" className="mb-3 rounded-xl bg-amber-50 px-3 py-2.5 text-[13px] text-amber-800">{slotsError}</p>}
              <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                {!day && <p className="py-10 text-center text-[13px] text-muted">Choose a date to see the times that are free.</p>}
                {day && loading && <p className="py-10 text-center text-[13px] text-muted">Checking the calendar…</p>}
                {day && !loading && !slotsError && slots.length === 0 && <p className="py-10 text-center text-[13px] text-muted">No times on this day. Try another.</p>}
                {day && !loading && slots.map((s) => (
                  <button key={s.startTime} type="button" disabled={!s.available} onClick={() => { setSlot(s); setSlotsError(""); setStep(2); }} className={`w-full rounded-xl border px-4 py-3 text-[14px] font-semibold transition ${s.available ? "border-line hover:border-violet hover:bg-violet/5 hover:text-violet" : "cursor-not-allowed border-transparent text-muted/60 line-through"}`}>{clock(s.startTime, tz, h24)}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={submit} className="mx-auto max-w-[520px] space-y-4">
            <button type="button" onClick={() => setStep(1)} className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" />Change time</button>
            {error && <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-700">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="d-name" className={label}>Your name *</label><input id="d-name" required value={form.name} onChange={set("name")} className={field} autoComplete="name" /></div>
              <div><label htmlFor="d-email" className={label}>Work email *</label><input id="d-email" type="email" required value={form.email} onChange={set("email")} className={field} autoComplete="email" /></div>
            </div>
            <div>
              <label htmlFor="d-phone" className={label}>Phone number *</label>
              <div className="flex gap-2"><select aria-label="Country code" value={code} onChange={(e) => setCode(e.target.value)} className={`${field} !w-[92px]`}>{CODES.map((c) => <option key={c}>{c}</option>)}</select><input id="d-phone" type="tel" required value={form.phone} onChange={set("phone")} className={field} autoComplete="tel-national" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="d-company" className={label}>Company</label><input id="d-company" value={form.company} onChange={set("company")} className={field} autoComplete="organization" /></div>
              <div><label htmlFor="d-team" className={label}>Team size</label><select id="d-team" value={form.teamSize} onChange={set("teamSize")} className={field}><option value="">Select</option>{TEAM_SIZES.map((t) => <option key={t}>{t}</option>)}</select></div>
            </div>
            <div><label htmlFor="d-site" className={label}>Website</label><input id="d-site" type="url" placeholder="https://" value={form.website} onChange={set("website")} className={field} autoComplete="url" /></div>
            <div>
              <span className={label}>What would you like to see?</span>
              <div className="flex flex-wrap gap-2">{INTERESTS.map((i) => <button key={i} type="button" aria-pressed={interests.includes(i)} onClick={() => toggle(i)} className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ${interests.includes(i) ? "border-violet bg-violet/10 text-violet" : "border-line hover:border-ink/20"}`}>{i}</button>)}</div>
            </div>
            <div><label htmlFor="d-msg" className={label}>Anything we should know?</label><textarea id="d-msg" rows={3} value={form.message} onChange={set("message")} className={`${field} resize-none`} /></div>
            <button type="submit" disabled={submitting} className="btn btn-primary w-full disabled:opacity-60">{submitting ? "Booking…" : "Confirm booking"}</button>
          </form>
        )}

        {step === 3 && done && (
          <div className="mx-auto flex max-w-[420px] flex-col items-center py-10 text-center">
            <span className="pop-in flex h-16 w-16 items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg,#10c98f,#2cd3ff)" }}><Check className="h-8 w-8" strokeWidth={3} /></span>
            <h2 className="font-display mt-6 text-[30px] font-semibold">{done.booked ? "Booking confirmed" : "Request received"}</h2>
            <p className="mt-3 text-[15px] leading-7 text-ink-soft">{done.booked ? "Your demo is on the calendar. The invite and meeting link are on their way to your inbox." : "We have your request and will email you to confirm a time."}</p>
            {done.booked && slot && day && <p className="mt-4 text-[14px] font-semibold">{pretty(day)} · {clock(slot.startTime, tz, h24)} to {clock(slot.endTime, tz, h24)}</p>}
            {done.meetLink && <a href={done.meetLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-6">Join with Google Meet</a>}
            <Link href="/" className="mt-5 text-[14px] font-semibold text-muted hover:text-ink">Back to home</Link>
          </div>
        )}
      </section>
    </div>
  );
}
