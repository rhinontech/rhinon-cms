import { api, getSession } from "./api";
import { MONTHS, ago, defineLive, parseDay, shortDate, toneAt, write } from "./live-core";
import { DOC_BODY, OPENINGS, type Candidate, type DocItem, type DocKind, type DocRequest, type Goal, type HiringStage, type Interview, type Opening } from "./mock-more";
import { actions, getState, hydrate } from "./store";
import { replace } from "./live-core";

const meId = () => getSession()?.userId ?? "";
const who = (id: string | null | undefined) => (id && id === meId() ? "me" : (id ?? ""));
const fmtSize = (n: number | null) => (!n ? "" : n > 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1000))} KB`);
const fmtDate = (iso: string | null) => (iso ? `${parseDay(iso).getDate()} ${MONTHS[parseDay(iso).getMonth()]}` : "—");

/* ── documents ───────────────────────────────────────────────────────────── */

type LetterBlock = { kind: string; text?: string; num?: string; marker?: string };
type ApiDoc = { contentBlocks?: LetterBlock[] | null; id: string; title: string; category: string; fileSize: number | null; fileKey: string | null; isRequest: boolean; requestNote: string | null; signingToken: string | null; signedAt: string | null; createdAt: string; uploader?: { fullName: string } | null };
const KIND: [RegExp, DocKind][] = [[/offer/i, "offer"], [/contract|agreement/i, "contract"], [/id|aadhaar|pan|passport/i, "id"], [/apprais/i, "appraisal"], [/nda|non-disclosure/i, "nda"]];
const kindOf = (category: string, title: string): DocKind => KIND.find(([re]) => re.test(category) || re.test(title))?.[1] ?? "other";
/** token + document id for the documents waiting on this person's signature. */
export const signing = new Map<string, string>();

async function syncDocs() {
  const rows = await api<ApiDoc[]>("/documents?employeeId=self").catch(() => [] as ApiDoc[]);
  signing.clear();
  for (const k of Object.keys(DOC_BODY)) delete DOC_BODY[k];
  const docs: DocItem[] = [];
  const requests: DocRequest[] = [];
  for (const d of rows) {
    if (d.isRequest) {
      requests.push({ id: d.id, title: d.title, by: d.uploader?.fullName ?? "HR", due: "Soon", note: d.requestNote ?? "", done: !!d.fileKey });
      continue;
    }
    if (d.signingToken && !d.signedAt) signing.set(d.id, d.signingToken);
    // Letters (offer, NDA) carry their text as blocks; a file document is read on the web or in the file itself.
    if (d.contentBlocks?.length) {
      DOC_BODY[d.id] = d.contentBlocks.filter((b) => b.text).map((b) => (b.kind === "heading" ? `${b.num ? `${b.num} ` : ""}${b.text}` : b.kind === "bullet" || b.kind === "numbered" ? `${b.marker ?? "•"} ${b.text}` : b.text!));
    }
    docs.push({ id: d.id, name: d.title, kind: kindOf(d.category, d.title), date: shortDate(d.createdAt), size: fmtSize(d.fileSize), state: d.signedAt ? "signed" : d.signingToken ? "to-sign" : "ok" });
  }
  hydrate({ docs, docRequests: requests });
}

/* ── performance ─────────────────────────────────────────────────────────── */

type ApiGoal = { id: string; title: string; description: string | null; progress: number; targetDate: string | null; cycle?: { name: string } | null };
type ApiReview = { id: string; revieweeId?: string; type: string; selfRating: number | null; managerRating: number | null; strengths: string | null; improvements: string | null; managerFeedback: string | null; selfFeedback: string | null; status: "pending" | "submitted"; cycle?: { name: string; status: string } | null; reviewee?: { id: string; fullName: string } | null };
let selfReviewId: string | null = null;

async function syncPerformance() {
  const [goals, reviews] = await Promise.all([
    api<ApiGoal[]>("/performance/goals").catch(() => [] as ApiGoal[]),
    api<{ selfReviews: ApiReview[]; managerReviews: ApiReview[] }>("/performance/reviews").catch(() => ({ selfReviews: [], managerReviews: [] })),
  ]);
  const self = reviews.selfReviews.find((r) => r.cycle?.status !== "closed") ?? reviews.selfReviews[0];
  selfReviewId = self?.id ?? null;
  hydrate({
    goals: goals.map((g): Goal => ({ id: g.id, title: g.title, keyResult: g.description ?? "", cycle: g.cycle?.name ?? "", progress: g.progress ?? 0, due: fmtDate(g.targetDate) })),
    selfReview: { submitted: self?.status === "submitted", rating: self?.selfRating ?? null, strengths: self?.strengths ?? "", growth: self?.improvements ?? "" },
    teamReviews: reviews.managerReviews.map((r) => ({
      id: r.id, who: who(r.reviewee?.id), status: r.status === "submitted" ? "Completed" : "Your review due", selfRating: null, selfNotes: "", managerRating: r.managerRating, managerNotes: r.managerFeedback ?? "",
    })),
  });
}

/* ── hiring ──────────────────────────────────────────────────────────────── */

type ApiOpening = { id: string; title: string; department: string | null; location: string | null; status: string; createdAt: string; totalCandidates: number };
type ApiCandidate = { id: string; fullName: string; stage: string; source: string | null; notes: string | null; noticePeriod: string | null };
type ApiInterview = { id: string; candidateId: string; roundName: string; scheduledAt: string; meetingLink: string | null; rating: number | null; recommendation: string | null; feedback: string | null; candidate?: { id: string; fullName: string; opening?: { title: string } | null } };
const STAGE: Record<string, HiringStage> = { applied: "Applied", shortlisted: "Screen", interview: "Interview", offer: "Offer", hired: "Hired" };
const STAGE_BACK: Record<HiringStage, string> = { Applied: "applied", Screen: "shortlisted", Interview: "interview", Offer: "offer", Hired: "hired" };
const REC: Record<string, Interview["rec"]> = { strong_yes: "Hire", yes: "Maybe", no: "No hire", strong_no: "No hire" };
const REC_BACK: Record<NonNullable<Interview["rec"]>, string> = { Hire: "strong_yes", Maybe: "yes", "No hire": "no" };
const dayWord = (iso: string): Interview["day"] => { const diff = Math.round((new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86_400_000); return diff < 0 ? "Yesterday" : diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : "Fri"; };

async function syncHiring() {
  const openings = await api<ApiOpening[]>("/hiring/openings").catch(() => null);
  if (!openings) { replace(OPENINGS, []); hydrate({ candidates: [], interviews: [] }); return; }
  replace(OPENINGS, openings.map((o): Opening => ({ id: o.id, title: o.title, dept: o.department ?? "", where: o.location ?? "", candidates: o.totalCandidates, state: o.status === "open" ? "Open" : "On hold", posted: ago(o.createdAt) })));
  const details = await Promise.all(openings.filter((o) => o.status !== "closed").map((o) => api<{ title: string; candidates: ApiCandidate[] }>(`/hiring/openings/${o.id}`).catch(() => null)));
  const candidates: Candidate[] = details.flatMap((d) => (d?.candidates ?? []).filter((c) => STAGE[c.stage]).map((c): Candidate => ({ id: c.id, name: c.fullName, role: d!.title, stage: STAGE[c.stage]!, exp: c.noticePeriod ?? "", source: c.source ?? "", summary: c.notes ?? "" })));
  const mine = await api<ApiInterview[]>("/hiring/my-interviews").catch(() => [] as ApiInterview[]);
  const d = new Date(); d.setHours(0, 0, 0, 0);
  const interviews: Interview[] = mine.filter((i) => new Date(i.scheduledAt).getTime() >= d.getTime() - 86_400_000).map((i) => {
    const t = new Date(i.scheduledAt);
    return { id: i.id, candidateId: i.candidateId, round: i.roundName, day: dayWord(i.scheduledAt), time: `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`, where: i.meetingLink ? "Video call" : "In person", rating: i.rating, rec: i.recommendation ? (REC[i.recommendation] ?? null) : null, notes: i.feedback ?? "" };
  });
  hydrate({ candidates, interviews });
}

/** Sign a document that is waiting on this person, typed or drawn, with the signing link the API issued for it. */
export async function signDocument(id: string, sig: { type: "typed"; fullName: string } | { type: "drawn"; signatureImageBase64: string }): Promise<void> {
  const token = signing.get(id);
  if (!token) throw new Error("This document can't be signed in the app. Ask HR to send the signing link again.");
  await api(`/document-signing/${token}/documents/${id}/sign`, { method: "POST", body: sig, auth: false });
  await syncDocs();
}

defineLive({
  name: "documents",
  sync: syncDocs,
  blank: () => { for (const k of Object.keys(DOC_BODY)) delete DOC_BODY[k]; hydrate({ docs: [], docRequests: [] }); },
  install: ({ orig }) => {
    actions.signDoc = (id) => { orig.signDoc(id); };
  },
});

defineLive({
  name: "performance",
  sync: syncPerformance,
  blank: () => hydrate({ goals: [], teamReviews: [], selfReview: { submitted: false, rating: null, strengths: "", growth: "" } }),
  install: ({ orig }) => {
    actions.addGoal = (title, keyResult, due) => {
      orig.addGoal(title, keyResult, due);
      write("performance", () => api("/performance/goals", { method: "POST", body: { title, description: keyResult } }));
    };
    actions.setGoalProgress = (id, progress) => {
      orig.setGoalProgress(id, progress);
      write("performance", () => api(`/performance/goals/${id}`, { method: "PUT", body: { progress, status: progress >= 100 ? "completed" : progress > 0 ? "in_progress" : "not_started" } }));
    };
    actions.submitSelfReview = (rating, strengths, growth) => {
      orig.submitSelfReview(rating, strengths, growth);
      if (selfReviewId) write("performance", () => api(`/performance/reviews/${selfReviewId}`, { method: "PUT", body: { selfRating: rating, strengths, improvements: growth, status: "submitted" } }));
    };
    actions.submitTeamReview = (id, rating, notes) => {
      orig.submitTeamReview(id, rating, notes);
      write("performance", () => api(`/performance/reviews/${id}`, { method: "PUT", body: { managerRating: rating, managerFeedback: notes, status: "submitted" } }));
    };
  },
});

defineLive({
  name: "hiring",
  sync: syncHiring,
  blank: () => { replace(OPENINGS, []); hydrate({ candidates: [], interviews: [] }); },
  install: ({ orig }) => {
    actions.submitFeedback = (id, rating, rec, notes) => {
      orig.submitFeedback(id, rating, rec, notes);
      write("hiring", () => api(`/hiring/interviews/${id}/feedback`, { method: "POST", body: { rating, recommendation: rec ? REC_BACK[rec] : "yes", feedback: notes } }));
    };
  },
});
void toneAt; void getState; void STAGE_BACK;
