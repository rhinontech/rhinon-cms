"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { TbFileText, TbBrandLinkedin, TbCalendarPlus, TbStarFilled, TbUserCheck, TbExternalLink } from "react-icons/tb";
import {
  hiringApi, jsonInit, inputCls, labelCls, INR, fmtDateTime, stageLabel, openResume, REC_LABEL, REC_STYLE,
  type Candidate, type Interview, type Round,
} from "./shared";
import { FeedbackForm } from "./FeedbackForm";
import { HiringAside } from "./HiringAside";

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ScheduleForm({ candidate, rounds, onDone }: { candidate: Candidate; rounds: Round[]; onDone: () => void }) {
  const [people, setPeople] = useState<{ id: string; fullName: string }[]>([]);
  const nextRound = candidate.stage === "interview"
    ? Math.min(candidate.roundIndex + ((candidate.interviews ?? []).some((i) => i.roundIndex === candidate.roundIndex && i.status === "completed") ? 1 : 0), rounds.length - 1)
    : 0;
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(11, 0, 0, 0);
  const [roundIndex, setRoundIndex] = useState(nextRound);
  const [interviewerId, setInterviewerId] = useState("");
  const [when, setWhen] = useState(toLocalInput(tomorrow));
  const [durationMins, setDurationMins] = useState("45");
  const [meetingLink, setMeetingLink] = useState("");
  const [notify, setNotify] = useState(true);
  const [addMeet, setAddMeet] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    hiringApi("/interviewers").then((r) => r.json()).then((d) => setPeople(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const save = async () => {
    if (!interviewerId) { toast.error("Pick an interviewer"); return; }
    setSaving(true);
    const r = await hiringApi(`/candidates/${candidate.id}/interviews`, jsonInit("POST", {
      roundIndex, interviewerId, scheduledAt: new Date(when).toISOString(), durationMins, meetingLink, notify, addMeet,
    }));
    const data = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) { toast.error(data.message || "Couldn't schedule"); return; }
    toast.success(notify ? "Interview scheduled — invites sent" : "Interview scheduled");
    onDone();
  };

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className={labelCls}>
          Round
          <select value={roundIndex} onChange={(e) => setRoundIndex(Number(e.target.value))} className={inputCls}>
            {rounds.map((r, i) => <option key={i} value={i}>{i + 1}. {r.name}</option>)}
          </select>
        </label>
        <label className={labelCls}>
          Interviewer
          <select value={interviewerId} onChange={(e) => setInterviewerId(e.target.value)} className={inputCls}>
            <option value="">Select</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </select>
        </label>
        <label className={labelCls}>
          Date & time
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={inputCls} />
        </label>
        <label className={labelCls}>
          Duration (min)
          <input type="number" min={10} value={durationMins} onChange={(e) => setDurationMins(e.target.value)} className={inputCls} />
        </label>
      </div>
      <label className={labelCls}>
        Meeting link
        <input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="Google Meet / Zoom link (optional)" className={inputCls} />
      </label>
      {!meetingLink.trim() && (
        <label className="flex items-center gap-2 text-sm text-foreground/85">
          <input type="checkbox" checked={addMeet} onChange={(e) => setAddMeet(e.target.checked)} />
          Create a Google Meet link
        </label>
      )}
      <label className="flex items-center gap-2 text-sm text-foreground/85">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        Email the candidate and interviewer
      </label>
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
          {saving ? "Scheduling…" : "Schedule"}
        </button>
      </div>
    </div>
  );
}

function RescheduleForm({ interview, onDone, onCancel }: { interview: Interview; onDone: () => void; onCancel: () => void }) {
  const [people, setPeople] = useState<{ id: string; fullName: string }[]>([]);
  const [when, setWhen] = useState(toLocalInput(new Date(interview.scheduledAt)));
  const [durationMins, setDurationMins] = useState(String(interview.durationMins));
  const [interviewerId, setInterviewerId] = useState(interview.interviewerId);
  const [meetingLink, setMeetingLink] = useState(interview.meetingLink ?? "");
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    hiringApi("/interviewers").then((r) => r.json()).then((d) => setPeople(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    const r = await hiringApi(`/interviews/${interview.id}`, jsonInit("PUT", {
      scheduledAt: new Date(when).toISOString(), durationMins, interviewerId, meetingLink, notify,
    }));
    const data = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) { toast.error(data.message || "Couldn't reschedule"); return; }
    toast.success(notify ? "Rescheduled — updates emailed" : "Rescheduled");
    onDone();
  };

  return (
    <div className="space-y-3 pt-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className={labelCls}>
          New date & time
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={inputCls} />
        </label>
        <label className={labelCls}>
          Duration (min)
          <input type="number" min={10} value={durationMins} onChange={(e) => setDurationMins(e.target.value)} className={inputCls} />
        </label>
        <label className={labelCls}>
          Interviewer
          <select value={interviewerId} onChange={(e) => setInterviewerId(e.target.value)} className={inputCls}>
            {people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </select>
        </label>
        <label className={labelCls}>
          Meeting link
          <input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} className={inputCls} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground/85">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        Email the candidate and interviewer about the change
      </label>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted/40">Back</button>
        <button onClick={save} disabled={saving} className="px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
          {saving ? "Saving…" : "Reschedule"}
        </button>
      </div>
    </div>
  );
}

function InterviewCard({ interview, onChanged }: { interview: Interview; onChanged: () => void }) {
  const [giving, setGiving] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const setStatus = async (status: Interview["status"]) => {
    const r = await hiringApi(`/interviews/${interview.id}`, jsonInit("PUT", { status }));
    if (r.ok) onChanged(); else toast.error("Couldn't update interview");
  };

  return (
    <div className="rounded-xl border border-border p-4 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{interview.roundName}</p>
          <p className="text-xs text-muted-foreground">
            {fmtDateTime(interview.scheduledAt)} · {interview.durationMins} min · {interview.interviewer?.fullName ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {interview.recommendation && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${REC_STYLE[interview.recommendation]}`}>{REC_LABEL[interview.recommendation]}</span>
          )}
          {interview.rating && <span className="flex items-center gap-0.5 text-xs text-amber-600"><TbStarFilled size={12} /> {interview.rating}</span>}
          <span className="text-xs text-muted-foreground capitalize">{interview.status.replace("_", " ")}</span>
        </div>
      </div>
      {interview.meetingLink && interview.status === "scheduled" && (
        <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-300 hover:underline">
          <TbExternalLink size={12} /> Meeting link
        </a>
      )}
      {interview.feedback && <p className="text-sm text-foreground/80 whitespace-pre-wrap">{interview.feedback}</p>}
      {interview.status === "scheduled" && !giving && !rescheduling && (
        <div className="flex flex-wrap gap-3 text-xs">
          <button onClick={() => setGiving(true)} className="font-medium text-blue-600 dark:text-blue-300 hover:underline">Add feedback</button>
          <button onClick={() => setRescheduling(true)} className="font-medium text-foreground/80 hover:text-foreground">Reschedule</button>
          {!interview.calendarEventId && (
            <button onClick={() => setStatus("scheduled")} className="text-muted-foreground hover:text-foreground" title="Put this interview on the shared Meetings calendar">
              Add to calendar
            </button>
          )}
          <button onClick={() => setStatus("no_show")} className="text-muted-foreground hover:text-foreground">No-show</button>
          <button onClick={() => confirm("Cancel this interview? The candidate and interviewer will be emailed and it's removed from the calendar.") && setStatus("cancelled")} className="text-muted-foreground hover:text-red-500">Cancel</button>
        </div>
      )}
      {rescheduling && <RescheduleForm interview={interview} onCancel={() => setRescheduling(false)} onDone={() => { setRescheduling(false); onChanged(); }} />}
      {giving && <FeedbackForm interview={interview} onSaved={() => { setGiving(false); onChanged(); }} />}
    </div>
  );
}

export function CandidatePanel({ candidateId, rounds, onClose, onChanged }: { candidateId: string; rounds: Round[]; onClose: () => void; onChanged: () => void }) {
  const router = useRouter();
  const roleSlug = usePathname().split("/")[1];
  const [c, setC] = useState<Candidate | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState("");
  const [offerCtc, setOfferCtc] = useState("");
  const [joiningDate, setJoiningDate] = useState("");

  const load = useCallback(() => {
    hiringApi(`/candidates/${candidateId}`).then(async (r) => {
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d.message || "Couldn't load candidate"); return; }
      setError("");
      setC(d);
      setOfferCtc(d.offeredCtc != null ? String(Number(d.offeredCtc)) : d.expectedCtc != null ? String(Number(d.expectedCtc)) : "");
      setJoiningDate(d.joiningDate ?? "");
    }).catch(() => setError("Couldn't load candidate"));
  }, [candidateId]);
  useEffect(() => { load(); }, [load]);

  const refresh = () => { load(); onChanged(); };

  const move = async (stage: Candidate["stage"], extra: Record<string, unknown> = {}) => {
    const r = await hiringApi(`/candidates/${candidateId}/move`, jsonInit("POST", { stage, ...extra }));
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { toast.error(data.message || "Couldn't move candidate"); return; }
    refresh();
  };

  const reject = (stage: "rejected" | "withdrawn") => {
    const reason = prompt(stage === "rejected" ? "Reason for rejecting (optional)" : "Why did they withdraw? (optional)");
    if (reason === null) return;
    move(stage, { reason });
  };

  if (!c) {
    return (
      <HiringAside title="Candidate" onClose={onClose}>
        <p className="text-sm text-muted-foreground">{error || "Loading…"}</p>
      </HiringAside>
    );
  }

  const interviews = c.interviews ?? [];
  const isLastRound = c.stage === "interview" && c.roundIndex >= rounds.length - 1;
  const closed = c.stage === "hired" || c.stage === "rejected" || c.stage === "withdrawn";

  return (
    <HiringAside title="Candidate Details" onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-semibold shrink-0">
            {c.fullName.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-foreground truncate">{c.fullName}</p>
            <p className="text-sm text-muted-foreground truncate">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
            <p className="mt-0.5 text-xs font-medium text-blue-600 dark:text-blue-300">{stageLabel(c, rounds)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={async () => { if (!(await openResume(c.id))) toast.error("Couldn't open resume"); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted/40">
            <TbFileText size={14} /> Resume
          </button>
          {c.linkedinUrl && (
            <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted/40">
              <TbBrandLinkedin size={14} /> LinkedIn
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Source", c.source ?? "—"],
            ["Notice period", c.noticePeriod ?? "—"],
            ["Current CTC", INR(c.currentCtc)],
            ["Expected CTC", INR(c.expectedCtc)],
          ].map(([k, v]) => (
            <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="text-foreground">{v}</p></div>
          ))}
        </div>
        {c.notes && <p className="text-sm text-foreground/80 whitespace-pre-wrap rounded-lg bg-muted/40 p-3">{c.notes}</p>}
        {c.rejectionReason && closed && <p className="text-sm text-red-600 dark:text-red-300">Reason: {c.rejectionReason}</p>}

        {/* Pipeline actions */}
        {!closed && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Move</p>
            <div className="flex flex-wrap gap-2">
              {c.stage === "applied" && (
                <button onClick={() => move("shortlisted")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground">Shortlist</button>
              )}
              {c.stage === "shortlisted" && (
                <button onClick={() => move("interview", { roundIndex: 0 })} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground">Move to {rounds[0]?.name}</button>
              )}
              {c.stage === "interview" && !isLastRound && (
                <button onClick={() => move("interview", { roundIndex: c.roundIndex + 1 })} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground">
                  Pass → {rounds[c.roundIndex + 1]?.name}
                </button>
              )}
              {(isLastRound || c.stage === "shortlisted") && (
                <button onClick={() => move("offer", { offeredCtc: offerCtc, joiningDate })} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-green-400 text-green-700 dark:text-green-300">
                  Make offer
                </button>
              )}
              <select value="" onChange={(e) => {
                const v = e.target.value;
                if (!v) return;
                if (v.startsWith("round:")) move("interview", { roundIndex: Number(v.slice(6)) });
                else move(v as Candidate["stage"]);
              }} className="px-2 py-1.5 text-xs border border-border rounded-lg bg-card">
                <option value="">Move to…</option>
                <option value="applied">Applied</option>
                <option value="shortlisted">Shortlisted</option>
                {rounds.map((r, i) => <option key={i} value={`round:${i}`}>{r.name}</option>)}
                <option value="offer">Offer</option>
              </select>
              <button onClick={() => reject("rejected")} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-300 dark:border-red-400/30 text-red-600 dark:text-red-300">Reject</button>
              <button onClick={() => reject("withdrawn")} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Withdrawn</button>
            </div>
          </div>
        )}

        {c.stage === "offer" && (
          <div className="rounded-xl border border-green-300 dark:border-green-400/30 bg-green-50 dark:bg-green-400/10 p-4 space-y-3">
            <p className="text-sm font-semibold text-green-800 dark:text-green-200">Offer</p>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelCls}>Offered CTC (₹/yr)<input type="number" value={offerCtc} onChange={(e) => setOfferCtc(e.target.value)} className={inputCls} /></label>
              <label className={labelCls}>Joining date<input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className={inputCls} /></label>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button onClick={() => move("offer", { offeredCtc: offerCtc, joiningDate }).then(() => toast.success("Offer saved"))}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg bg-card">Save</button>
              <button
                onClick={async () => {
                  await move("offer", { offeredCtc: offerCtc, joiningDate });
                  router.push(`/${roleSlug}/employees?fromCandidate=${c.id}`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700">
                <TbUserCheck size={14} /> Confirm & convert to employee
              </button>
            </div>
            <p className="text-xs text-green-800/80 dark:text-green-200/80">Opens Add member prefilled — the offer letter and NDA go out from there.</p>
          </div>
        )}
        {c.stage === "hired" && (
          <div className="rounded-xl bg-green-50 dark:bg-green-400/10 p-4 text-sm text-green-800 dark:text-green-200">
            Hired{c.joiningDate ? ` · joining ${new Date(c.joiningDate).toLocaleDateString("en-IN", { dateStyle: "medium" })}` : ""}. They&apos;re now in the Team directory.
          </div>
        )}

        {/* Interviews */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interviews</p>
            {!closed && !scheduling && (
              <button onClick={() => setScheduling(true)} className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-300 hover:underline">
                <TbCalendarPlus size={14} /> Schedule
              </button>
            )}
          </div>
          {scheduling && <ScheduleForm candidate={c} rounds={rounds} onDone={() => { setScheduling(false); refresh(); }} />}
          {interviews.length === 0 && !scheduling && <p className="text-sm text-muted-foreground">No interviews yet.</p>}
          {interviews.map((i) => <InterviewCard key={i.id} interview={i} onChanged={refresh} />)}
        </div>
      </div>
    </HiringAside>
  );
}
