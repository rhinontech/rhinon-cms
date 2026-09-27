"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { submitFeedback } from "@/services/eventService";
import { GuestCard, primaryButton } from "./GuestShell";

const field =
  "w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-[14.5px] text-[#0B1B3D] placeholder:text-[#94A3B8] outline-none transition focus:border-[#0052FF] focus:ring-4 focus:ring-[#0052FF]/10";

function Field({ label, hint, children, required }: { label: string; hint?: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-[#334155]">
        {label}
        {required ? <span className="text-[#DC2626]"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[12px] text-[#94A3B8]">{hint}</span> : null}
    </label>
  );
}

const isUrl = (v: string) => /^https?:\/\/\S+\.\S+/i.test(v.trim());

/**
 * Product Space's WorkshopForm / TeardownForm / HackathonForm, as one form
 * that switches its questions on the event type.
 */
export default function FeedbackForm({
  slug,
  token,
  eventType,
  guest,
  registrationHref,
}: {
  slug: string;
  token: string;
  eventType: string;
  guest: { name: string; email: string | null };
  registrationHref: string;
}) {
  const team = eventType === "Hackathon" || eventType === "Teardown";
  const [values, setValues] = useState<Record<string, string>>({
    teamMember1Name: guest.name,
    teamMember1Email: guest.email || "",
    interestedInPrograms: "",
  });
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const set = (key: string) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const v = (key: string) => values[key] || "";

  const validate = (): string | null => {
    if (!team) {
      if (!rating) return "Please give the session a rating.";
      if (!v("feedback").trim()) return "Tell us what worked for you.";
      return null;
    }
    if (!v("teamName").trim()) return "Add your team name.";
    if (!v("teamMember2Name").trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("teamMember2Email"))) return "Add your teammate's name and email.";
    const main = eventType === "Hackathon" ? v("agentLink") : v("submissionLink");
    if (!isUrl(main)) return eventType === "Hackathon" ? "Add a working link to your agent." : "Add a link to your submission.";
    for (const key of ["videoDemoLink", "teardownDeck", "additionalMaterial"]) {
      if (v(key).trim() && !isUrl(v(key))) return "Links need to start with https://";
    }
    return null;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError("");
    const data: Record<string, string | number | boolean> = {};
    for (const [k, value] of Object.entries(values)) if (value.trim()) data[k] = value.trim();
    if (!team) data.rating = rating;
    const res = await submitFeedback(slug, token, data);
    setBusy(false);
    if (res.success) setDone(true);
    else setError(res.message || "Could not submit. Please try again.");
  };

  if (done) {
    return (
      <GuestCard className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#ECFDF3] text-[#16A34A]"><CheckCircle2 className="size-7" /></span>
        <h2 className="mt-5 text-2xl font-extrabold tracking-tight">{team ? "Submission received" : "Thank you!"}</h2>
        <p className="mx-auto mt-2 max-w-sm text-[15px] text-[#475569]">
          {team ? "Your teammate has it on their record too. We'll review every submission before certificates go out." : "Your certificate is issued once responses are reviewed — we'll email it to you."}
        </p>
        <Link href={registrationHref} className={`${primaryButton} mt-6`}>Back to your registration</Link>
      </GuestCard>
    );
  }

  return (
    <GuestCard>
      <form onSubmit={submit} noValidate className="space-y-5">
        <div>
          <h2 className="text-[22px] font-extrabold tracking-tight">{team ? `Submit your ${eventType.toLowerCase()} work` : "How was the session?"}</h2>
          <p className="mt-1 text-[14.5px] text-[#475569]">{team ? "One submission per team. You can only submit once, so check the links open." : "Two minutes — it shapes the next session."}</p>
        </div>

        {!team ? (
          <>
            <div>
              <span className="mb-2 block text-[13px] font-semibold text-[#334155]">Your rating <span className="text-[#DC2626]">*</span></span>
              <div className="flex gap-1.5" role="radiogroup" aria-label="Rating out of 5" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} className="rounded-lg p-1 transition hover:scale-110">
                    <Star className={`size-8 ${(hover || rating) >= n ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#CBD5E1]"}`} />
                  </button>
                ))}
              </div>
            </div>
            <Field label="What worked for you?" required>
              <textarea rows={3} className={`${field} resize-none`} value={v("feedback")} onChange={set("feedback")} />
            </Field>
            <Field label="What should we improve?">
              <textarea rows={3} className={`${field} resize-none`} value={v("improvement")} onChange={set("improvement")} />
            </Field>
            <Field label="LinkedIn profile" hint="Optional — so we can tag you when we share highlights.">
              <input className={field} value={v("linkedinLink")} onChange={set("linkedinLink")} placeholder="https://linkedin.com/in/…" />
            </Field>
            <Field label="Interested in UpperCurve's longer programmes?">
              <div className="flex gap-2">
                {["Yes", "Maybe", "No"].map((option) => (
                  <button key={option} type="button" onClick={() => setValues((x) => ({ ...x, interestedInPrograms: option }))}
                    className={`flex-1 rounded-xl border py-2.5 text-[14px] font-semibold transition ${v("interestedInPrograms") === option ? "border-[#0052FF] bg-[#EBF3FF] text-[#0052FF]" : "border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]"}`}>
                    {option}
                  </button>
                ))}
              </div>
            </Field>
          </>
        ) : (
          <>
            <Field label="Team name" required><input className={field} value={v("teamName")} onChange={set("teamName")} /></Field>
            <div className="rounded-2xl border border-[#E2E8F0] p-4 space-y-3">
              <p className="text-[13px] font-semibold">You</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <input className={field} value={v("teamMember1Name")} onChange={set("teamMember1Name")} placeholder="Name" aria-label="Your name" />
                <input className={field} value={v("teamMember1Email")} onChange={set("teamMember1Email")} placeholder="Email" aria-label="Your email" />
                <input className={field} value={v("teamMember1Phone")} onChange={set("teamMember1Phone")} placeholder="Phone" aria-label="Your phone" />
              </div>
            </div>
            <div className="rounded-2xl border border-[#E2E8F0] p-4 space-y-3">
              <p className="text-[13px] font-semibold">Your teammate <span className="text-[#DC2626]">*</span></p>
              <div className="grid gap-3 sm:grid-cols-3">
                <input className={field} value={v("teamMember2Name")} onChange={set("teamMember2Name")} placeholder="Name" aria-label="Teammate's name" />
                <input className={field} value={v("teamMember2Email")} onChange={set("teamMember2Email")} placeholder="Email they registered with" aria-label="Teammate's email" />
                <input className={field} value={v("teamMember2Phone")} onChange={set("teamMember2Phone")} placeholder="Phone" aria-label="Teammate's phone" />
              </div>
              <p className="text-[12px] text-[#94A3B8]">Use the email they registered with, so the submission is linked to them.</p>
            </div>
            {eventType === "Hackathon" ? (
              <>
                <Field label="Link to your agent" required><input className={field} value={v("agentLink")} onChange={set("agentLink")} placeholder="https://" /></Field>
                <Field label="Test credentials" hint="If reviewers need to log in to try it."><input className={field} value={v("agentCredentials")} onChange={set("agentCredentials")} /></Field>
                <Field label="Demo video"><input className={field} value={v("videoDemoLink")} onChange={set("videoDemoLink")} placeholder="https://" /></Field>
                <Field label="Deck"><input className={field} value={v("teardownDeck")} onChange={set("teardownDeck")} placeholder="https://" /></Field>
                <Field label="Anything else"><input className={field} value={v("additionalMaterial")} onChange={set("additionalMaterial")} placeholder="https://" /></Field>
              </>
            ) : (
              <Field label="Link to your submission" required hint="A shared doc, deck or folder anyone with the link can open.">
                <input className={field} value={v("submissionLink")} onChange={set("submissionLink")} placeholder="https://" />
              </Field>
            )}
          </>
        )}

        {error ? <p role="alert" className="rounded-xl bg-[#FEF2F2] px-3.5 py-2.5 text-[13px] text-[#B91C1C]">{error}</p> : null}
        <button type="submit" disabled={busy} className={`${primaryButton} w-full disabled:opacity-70`}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null} {team ? "Submit" : "Send feedback"}
        </button>
      </form>
    </GuestCard>
  );
}
