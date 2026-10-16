import { Router, Response } from "express";
import multer from "multer";
import { keepTenantContext } from "../services/tenantContext";
import { Op } from "sequelize";
import { JobOpening, Candidate, Interview, User, Role } from "../models";
import { CANDIDATE_STAGES, type CandidateStage, type InterviewRoundDef } from "../models/Hiring";
import { authenticate, authorize, hasPermission, AuthRequest } from "../middleware/authenticate";
import { uploadBuffer, getPresignedReadUrl } from "../services/storage";
import { sendEmail } from "../services/mailer";
import { env } from "../config/env";
import { interviewScheduledEmail, interviewerAssignedEmail } from "../services/emailTemplates";
import { buildMeetingIcs } from "../services/meetingInvite";
import { createEvent, updateEvent, deleteEvent, CalendarNotConnectedError } from "../services/googleCalendar";

// Hiring pipeline: openings → candidates → interview rounds → offer → hired.
// Managing it needs employees:write; anyone can see and give feedback on the
// interviews assigned to them.
const router = Router();
router.use(authenticate);

const ADMIN = "employees:write";
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const str = (v: unknown, max = 255) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const num = (v: unknown) => (v === "" || v == null || !Number.isFinite(Number(v)) ? null : Number(v));

function parseRounds(raw: unknown): InterviewRoundDef[] | null {
  const list = typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : raw;
  if (!Array.isArray(list)) return null;
  const rounds = list.map((r) => ({ name: String(r?.name ?? "").trim().slice(0, 80) })).filter((r) => r.name);
  return rounds.length > 0 ? rounds : null;
}

function openingFields(body: any) {
  return {
    title: str(body.title, 200),
    department: str(body.department),
    location: str(body.location),
    employmentType: str(body.employmentType) ?? "Full-Time",
    positions: Math.max(1, Math.floor(Number(body.positions) || 1)),
    salaryMin: num(body.salaryMin),
    salaryMax: num(body.salaryMax),
    description: str(body.description, 10000),
    hiringManagerId: str(body.hiringManagerId),
  };
}

function candidateFields(body: any) {
  return {
    fullName: str(body.fullName, 200),
    email: str(body.email, 200)?.toLowerCase() ?? null,
    phone: str(body.phone, 40),
    source: str(body.source, 80),
    linkedinUrl: str(body.linkedinUrl, 500),
    currentCtc: num(body.currentCtc),
    expectedCtc: num(body.expectedCtc),
    noticePeriod: str(body.noticePeriod, 80),
    notes: str(body.notes, 10000),
  };
}

const interviewerInclude = { model: User, as: "interviewer", attributes: ["id", "fullName", "companyEmail"] };

// ── Openings ──────────────────────────────────────────────────────────────────

router.get("/openings", authorize(ADMIN), async (_req: AuthRequest, res: Response) => {
  const openings = await JobOpening.findAll({
    include: [
      { model: Candidate, as: "candidates", attributes: ["id", "stage"] },
      { model: User, as: "hiringManager", attributes: ["id", "fullName"] },
    ],
    order: [["createdAt", "DESC"]],
  });
  const upcoming = await Interview.findAll({
    where: { status: "scheduled", scheduledAt: { [Op.gte]: new Date() } },
    include: [{ model: Candidate, as: "candidate", attributes: ["openingId"] }],
    attributes: ["id"],
  });

  res.json(openings.map((o) => {
    const json = o.toJSON() as any;
    const counts: Record<string, number> = {};
    for (const c of json.candidates) counts[c.stage] = (counts[c.stage] ?? 0) + 1;
    delete json.candidates;
    return {
      ...json,
      counts,
      totalCandidates: Object.values(counts).reduce((a, b) => a + b, 0),
      upcomingInterviews: upcoming.filter((i: any) => i.candidate?.openingId === o.id).length,
    };
  }));
});

router.post("/openings", authorize(ADMIN), async (req: AuthRequest, res: Response) => {
  const fields = openingFields(req.body);
  const rounds = parseRounds(req.body.rounds);
  if (!fields.title) { res.status(400).json({ message: "Job title is required" }); return; }
  if (!rounds) { res.status(400).json({ message: "Add at least one interview round" }); return; }
  const opening = await JobOpening.create({ ...fields, title: fields.title, rounds, createdById: req.user!.userId });
  res.status(201).json(opening);
});

router.get("/openings/:id", authorize(ADMIN), async (req: AuthRequest, res: Response) => {
  const opening = await JobOpening.findByPk(req.params.id, {
    include: [
      { model: User, as: "hiringManager", attributes: ["id", "fullName"] },
      {
        model: Candidate,
        as: "candidates",
        include: [{ model: Interview, as: "interviews", attributes: ["id", "roundIndex", "status", "scheduledAt", "rating", "recommendation"] }],
      },
    ],
    order: [[{ model: Candidate, as: "candidates" }, "createdAt", "ASC"]],
  });
  if (!opening) { res.status(404).json({ message: "Opening not found" }); return; }
  res.json(opening);
});

router.put("/openings/:id", authorize(ADMIN), async (req: AuthRequest, res: Response) => {
  const opening = await JobOpening.findByPk(req.params.id);
  if (!opening) { res.status(404).json({ message: "Opening not found" }); return; }
  const fields = openingFields(req.body);
  if (!fields.title) { res.status(400).json({ message: "Job title is required" }); return; }

  const patch: any = { ...fields };
  if (req.body.rounds !== undefined) {
    const rounds = parseRounds(req.body.rounds);
    if (!rounds) { res.status(400).json({ message: "Add at least one interview round" }); return; }
    // Removing rounds that candidates are sitting in would strand them
    const stranded = await Candidate.count({ where: { openingId: opening.id, stage: "interview", roundIndex: { [Op.gte]: rounds.length } } });
    if (stranded > 0) { res.status(400).json({ message: `${stranded} candidate(s) are in a round you're removing — move them first` }); return; }
    patch.rounds = rounds;
  }
  if (["open", "on_hold", "closed"].includes(req.body.status)) patch.status = req.body.status;
  await opening.update(patch);
  res.json(opening);
});

router.delete("/openings/:id", authorize(ADMIN), async (req: AuthRequest, res: Response) => {
  const opening = await JobOpening.findByPk(req.params.id);
  if (!opening) { res.status(404).json({ message: "Opening not found" }); return; }
  if ((await Candidate.count({ where: { openingId: opening.id } })) > 0) {
    res.status(400).json({ message: "This opening has candidates — close it instead" });
    return;
  }
  await opening.destroy();
  res.json({ message: "Opening deleted" });
});

// ── Candidates ────────────────────────────────────────────────────────────────

router.post("/openings/:id/candidates", authorize(ADMIN), keepTenantContext(upload.single("resume")), async (req: AuthRequest, res: Response) => {
  const opening = await JobOpening.findByPk(req.params.id);
  if (!opening) { res.status(404).json({ message: "Opening not found" }); return; }
  const fields = candidateFields(req.body);
  if (!fields.fullName || !fields.email) { res.status(400).json({ message: "Name and email are required" }); return; }
  if (!req.file) { res.status(400).json({ message: "Attach the candidate's resume" }); return; }
  if (await Candidate.findOne({ where: { openingId: opening.id, email: fields.email } })) {
    res.status(409).json({ message: "This candidate is already in this opening" });
    return;
  }

  const resumeKey = await uploadBuffer(req.file.buffer, req.file.originalname, "resumes", req.file.mimetype);
  const candidate = await Candidate.create({
    ...fields,
    fullName: fields.fullName,
    email: fields.email,
    openingId: opening.id,
    resumeKey,
    resumeName: req.file.originalname,
    addedById: req.user!.userId,
  });
  res.status(201).json(candidate);
});

router.get("/candidates/:id", authorize(ADMIN), async (req: AuthRequest, res: Response) => {
  const candidate = await Candidate.findByPk(req.params.id, {
    include: [
      { model: JobOpening, as: "opening" },
      { model: Interview, as: "interviews", include: [interviewerInclude] },
    ],
    order: [[{ model: Interview, as: "interviews" }, "scheduledAt", "ASC"]],
  });
  if (!candidate) { res.status(404).json({ message: "Candidate not found" }); return; }
  res.json(candidate);
});

router.put("/candidates/:id", authorize(ADMIN), async (req: AuthRequest, res: Response) => {
  const candidate = await Candidate.findByPk(req.params.id);
  if (!candidate) { res.status(404).json({ message: "Candidate not found" }); return; }
  const fields = candidateFields(req.body);
  if (!fields.fullName || !fields.email) { res.status(400).json({ message: "Name and email are required" }); return; }
  await candidate.update({ ...fields, fullName: fields.fullName, email: fields.email });
  res.json(candidate);
});

// Resume link — admins, or anyone who interviews this candidate
router.get("/candidates/:id/resume", async (req: AuthRequest, res: Response) => {
  const candidate = await Candidate.findByPk(req.params.id);
  if (!candidate) { res.status(404).json({ message: "Candidate not found" }); return; }
  const allowed = hasPermission(req, ADMIN)
    || (await Interview.count({ where: { candidateId: candidate.id, interviewerId: req.user!.userId } })) > 0;
  if (!allowed) { res.status(403).json({ message: "Forbidden" }); return; }
  res.json({ url: await getPresignedReadUrl(candidate.resumeKey, 300) });
});

// Move through the pipeline: { stage, roundIndex?, reason?, offeredCtc?, joiningDate? }
router.post("/candidates/:id/move", authorize(ADMIN), async (req: AuthRequest, res: Response) => {
  const candidate = await Candidate.findByPk(req.params.id, { include: [{ model: JobOpening, as: "opening" }] });
  if (!candidate) { res.status(404).json({ message: "Candidate not found" }); return; }
  const stage = req.body.stage as CandidateStage;
  if (!CANDIDATE_STAGES.includes(stage)) { res.status(400).json({ message: "Unknown stage" }); return; }
  if (stage === "hired") { res.status(400).json({ message: "Use “Convert to employee” to hire" }); return; }
  if (candidate.stage === "hired") { res.status(400).json({ message: "This candidate is already hired" }); return; }

  const rounds = (candidate as any).opening.rounds as InterviewRoundDef[];
  const patch: any = { stage };
  if (stage === "interview") {
    const idx = Number(req.body.roundIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= rounds.length) { res.status(400).json({ message: "Pick a valid round" }); return; }
    patch.roundIndex = idx;
  }
  if (stage === "rejected" || stage === "withdrawn") patch.rejectionReason = str(req.body.reason, 1000);
  else patch.rejectionReason = null;
  if (stage === "offer") {
    if (req.body.offeredCtc !== undefined) patch.offeredCtc = num(req.body.offeredCtc);
    if (req.body.joiningDate !== undefined) patch.joiningDate = str(req.body.joiningDate, 10);
  }
  await candidate.update(patch);
  res.json(candidate);
});

// Called by the Team → Add member form after it creates the employee
router.post("/candidates/:id/hired", authorize(ADMIN), async (req: AuthRequest, res: Response) => {
  const candidate = await Candidate.findByPk(req.params.id);
  if (!candidate) { res.status(404).json({ message: "Candidate not found" }); return; }
  const user = await User.findByPk(req.body.userId);
  if (!user) { res.status(404).json({ message: "Employee not found" }); return; }
  await candidate.update({ stage: "hired", hiredUserId: user.id, rejectionReason: null });

  // Opening fills up → close it automatically
  const opening = await JobOpening.findByPk(candidate.openingId);
  if (opening && opening.status === "open") {
    const hired = await Candidate.count({ where: { openingId: opening.id, stage: "hired" } });
    if (hired >= opening.positions) await opening.update({ status: "closed" });
  }
  res.json(candidate);
});

// ── Interviews ────────────────────────────────────────────────────────────────

router.get("/interviewers", authorize(ADMIN), async (_req: AuthRequest, res: Response) => {
  const users = await User.findAll({
    where: { userType: "internal", status: "active" },
    attributes: ["id", "fullName", "department"],
    order: [["fullName", "ASC"]],
  });
  res.json(users);
});

function fmtWhen(start: Date, durationMins: number) {
  const end = new Date(start.getTime() + durationMins * 60000);
  const date = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(start);
  const time = (d: Date) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true }).format(d);
  return `${date}, ${time(start)} – ${time(end)} IST`;
}

function interviewEnd(i: Interview) {
  return new Date(i.scheduledAt.getTime() + i.durationMins * 60000);
}

function calendarTitle(candidate: Candidate, opening: JobOpening, interview: Interview) {
  return `Interview: ${candidate.fullName} — ${opening.title} (${interview.roundName})`;
}

/**
 * Puts the interview on the shared calendar (so it shows on Meetings) or keeps it in sync.
 * Never fails the request: an unconnected calendar just means email-only invites.
 */
async function syncInterviewCalendar(
  interview: Interview, candidate: Candidate, opening: JobOpening, interviewer: User, opts: { addMeet?: boolean } = {},
) {
  const interviewerEmail = interviewer.companyEmail || (interviewer as any).personalEmail || null;
  const input = {
    summary: calendarTitle(candidate, opening, interview),
    description: `Candidate: ${candidate.fullName} <${candidate.email}>\nInterviewer: ${interviewer.fullName}\nRound: ${interview.roundName}`,
    location: interview.meetingLink,
    startTime: interview.scheduledAt,
    endTime: interviewEnd(interview),
    attendees: [candidate.email, ...(interviewerEmail ? [interviewerEmail] : [])],
  };
  try {
    const event = interview.calendarEventId
      ? await updateEvent(interview.calendarEventId, input)
      : await createEvent({ ...input, addMeet: Boolean(opts.addMeet && !interview.meetingLink) });
    await interview.update({
      calendarEventId: event.id,
      calendarICalUID: event.iCalUID,
      // Google generated a Meet link — use it everywhere
      ...(!interview.meetingLink && event.meetLink ? { meetingLink: event.meetLink } : {}),
    });
  } catch (err) {
    if (!(err instanceof CalendarNotConnectedError)) {
      console.error("[Hiring] Calendar sync failed:", (err as any)?.response?.data?.error?.message || (err as Error).message);
    }
  }
}

async function notifyInterview(interview: Interview, candidate: Candidate, opening: JobOpening, interviewer: User) {
  const interviewerEmail = interviewer.companyEmail || (interviewer as any).personalEmail || null;
  const base = {
    candidateName: candidate.fullName,
    jobTitle: opening.title,
    roundName: interview.roundName,
    whenLabel: fmtWhen(interview.scheduledAt, interview.durationMins),
    durationMins: interview.durationMins,
    meetingLink: interview.meetingLink,
  };

  // One invite per recipient so "Add to Calendar" / RSVP works in Gmail & Outlook
  const ics = (attendee: string) => {
    try {
      return buildMeetingIcs({
        id: interview.id,
        iCalUID: interview.calendarICalUID || `interview-${interview.id}@rhinontech.in`,
        sequence: 0,
        summary: `Interview: ${opening.title} — ${interview.roundName}${attendee === candidate.email ? "" : ` (${candidate.fullName})`}`,
        description: interview.meetingLink ? `Join: ${interview.meetingLink}` : null,
        location: interview.meetingLink,
        start: interview.scheduledAt.toISOString(),
        end: new Date(interview.scheduledAt.getTime() + interview.durationMins * 60000).toISOString(),
        allDay: false,
        meetLink: interview.meetingLink,
        htmlLink: null,
        organizer: null,
        attendees: [{ email: attendee, responseStatus: null }],
      } as any, "request", { email: interviewerEmail || attendee, name: interviewer.fullName });
    } catch (err) {
      console.error("[Hiring] Couldn't build calendar invite:", (err as Error).message);
      return null;
    }
  };
  const withInvite = (to: string, mail: { subject: string; html: string; text: string }) => {
    const content = ics(to);
    return sendEmail({ to, ...mail, ...(content ? { icalEvent: { method: "REQUEST", content, filename: "interview.ics" } } : {}) });
  };

  const sends = [withInvite(candidate.email, interviewScheduledEmail(base))];
  if (interviewerEmail) {
    sends.push(withInvite(interviewerEmail, interviewerAssignedEmail({
      ...base,
      interviewerName: interviewer.fullName,
      feedbackUrl: `${env.frontendUrl}/${(interviewer as any).role?.slug || "employee"}/employees/hiring/interviews`,
    })));
  }
  const results = await Promise.allSettled(sends);
  results.forEach((r) => r.status === "rejected" && console.error("[Hiring] Interview email failed:", (r.reason as Error)?.message));
}

router.post("/candidates/:id/interviews", authorize(ADMIN), async (req: AuthRequest, res: Response) => {
  const candidate = await Candidate.findByPk(req.params.id, { include: [{ model: JobOpening, as: "opening" }] });
  if (!candidate) { res.status(404).json({ message: "Candidate not found" }); return; }
  const opening = (candidate as any).opening as JobOpening;
  const roundIndex = Number(req.body.roundIndex);
  if (!Number.isInteger(roundIndex) || roundIndex < 0 || roundIndex >= opening.rounds.length) {
    res.status(400).json({ message: "Pick a valid round" });
    return;
  }
  const interviewer = await User.findByPk(req.body.interviewerId, { include: [{ model: Role, as: "role", attributes: ["slug"] }] });
  if (!interviewer) { res.status(400).json({ message: "Pick an interviewer" }); return; }
  const scheduledAt = new Date(req.body.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) { res.status(400).json({ message: "Pick a date and time" }); return; }

  const interview = await Interview.create({
    candidateId: candidate.id,
    roundIndex,
    roundName: opening.rounds[roundIndex].name,
    interviewerId: interviewer.id,
    scheduledAt,
    durationMins: Math.min(480, Math.max(10, Math.floor(Number(req.body.durationMins) || 45))),
    meetingLink: str(req.body.meetingLink, 1000),
  });

  // Scheduling a round puts the candidate in it (never moves them backwards)
  if (["applied", "shortlisted"].includes(candidate.stage) || (candidate.stage === "interview" && roundIndex > candidate.roundIndex)) {
    await candidate.update({ stage: "interview", roundIndex });
  }

  await syncInterviewCalendar(interview, candidate, opening, interviewer, { addMeet: req.body.addMeet !== false });
  if (req.body.notify !== false) notifyInterview(interview, candidate, opening, interviewer).catch(() => {});
  res.status(201).json(interview);
});

router.put("/interviews/:id", authorize(ADMIN), async (req: AuthRequest, res: Response) => {
  const interview = await Interview.findByPk(req.params.id);
  if (!interview) { res.status(404).json({ message: "Interview not found" }); return; }
  const patch: any = {};
  if (req.body.scheduledAt) {
    const d = new Date(req.body.scheduledAt);
    if (Number.isNaN(d.getTime())) { res.status(400).json({ message: "Invalid date" }); return; }
    patch.scheduledAt = d;
  }
  if (req.body.interviewerId) patch.interviewerId = req.body.interviewerId;
  if (req.body.meetingLink !== undefined) patch.meetingLink = str(req.body.meetingLink, 1000);
  if (req.body.durationMins) patch.durationMins = Math.min(480, Math.max(10, Math.floor(Number(req.body.durationMins))));
  if (["scheduled", "completed", "cancelled", "no_show"].includes(req.body.status)) patch.status = req.body.status;
  await interview.update(patch);

  if (interview.status === "cancelled" || interview.status === "no_show") {
    if (interview.status === "cancelled" && interview.calendarEventId) {
      await deleteEvent(interview.calendarEventId).catch((err) => console.error("[Hiring] Calendar delete failed:", err.message));
      await interview.update({ calendarEventId: null });
    }
  } else if (patch.scheduledAt || patch.interviewerId || patch.meetingLink !== undefined || patch.durationMins || !interview.calendarEventId) {
    const candidate = await Candidate.findByPk(interview.candidateId, { include: [{ model: JobOpening, as: "opening" }] });
    const interviewer = await User.findByPk(interview.interviewerId);
    if (candidate && interviewer && interview.status === "scheduled") {
      await syncInterviewCalendar(interview, candidate, (candidate as any).opening, interviewer);
    }
  }
  res.json(interview);
});

// Interviews assigned to me (any role)
router.get("/my-interviews", async (req: AuthRequest, res: Response) => {
  const interviews = await Interview.findAll({
    where: { interviewerId: req.user!.userId, status: { [Op.ne]: "cancelled" } },
    include: [{
      model: Candidate,
      as: "candidate",
      attributes: ["id", "fullName", "email", "phone", "linkedinUrl", "resumeName"],
      include: [{ model: JobOpening, as: "opening", attributes: ["id", "title"] }],
    }],
    order: [["scheduledAt", "DESC"]],
  });
  res.json(interviews);
});

router.post("/interviews/:id/feedback", async (req: AuthRequest, res: Response) => {
  const interview = await Interview.findByPk(req.params.id);
  if (!interview) { res.status(404).json({ message: "Interview not found" }); return; }
  if (interview.interviewerId !== req.user!.userId && !hasPermission(req, ADMIN)) {
    res.status(403).json({ message: "Only the interviewer can leave feedback" });
    return;
  }
  const rating = Number(req.body.rating);
  const recommendation = req.body.recommendation;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) { res.status(400).json({ message: "Rate 1–5" }); return; }
  if (!["strong_yes", "yes", "no", "strong_no"].includes(recommendation)) { res.status(400).json({ message: "Pick a recommendation" }); return; }
  const feedback = str(req.body.feedback, 10000);
  if (!feedback) { res.status(400).json({ message: "Write a few lines of feedback" }); return; }

  await interview.update({ rating, recommendation, feedback, feedbackAt: new Date(), status: "completed" });
  res.json(interview);
});

export default router;
