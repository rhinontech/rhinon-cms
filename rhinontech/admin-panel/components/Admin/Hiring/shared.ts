import Cookies from "js-cookie";

export const hiringApi = (path: string, init: RequestInit = {}) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/hiring${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${Cookies.get("authToken")}`, ...(init.headers || {}) },
  });

export const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export type CandidateStage = "applied" | "shortlisted" | "interview" | "offer" | "hired" | "rejected" | "withdrawn";
export type Recommendation = "strong_yes" | "yes" | "no" | "strong_no";

export interface Round { name: string }

export interface Opening {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employmentType: string;
  positions: number;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string | null;
  rounds: Round[];
  status: "open" | "on_hold" | "closed";
  hiringManagerId: string | null;
  hiringManager?: { id: string; fullName: string } | null;
  counts?: Partial<Record<CandidateStage, number>>;
  totalCandidates?: number;
  upcomingInterviews?: number;
  candidates?: Candidate[];
}

export interface Interview {
  id: string;
  candidateId: string;
  roundIndex: number;
  roundName: string;
  interviewerId: string;
  scheduledAt: string;
  durationMins: number;
  meetingLink: string | null;
  calendarEventId?: string | null;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  rating: number | null;
  recommendation: Recommendation | null;
  feedback: string | null;
  interviewer?: { id: string; fullName: string };
  candidate?: { id: string; fullName: string; email: string; phone: string | null; linkedinUrl: string | null; opening?: { id: string; title: string } };
}

export interface Candidate {
  id: string;
  openingId: string;
  fullName: string;
  email: string;
  phone: string | null;
  source: string | null;
  linkedinUrl: string | null;
  currentCtc: number | null;
  expectedCtc: number | null;
  noticePeriod: string | null;
  resumeName: string;
  notes: string | null;
  stage: CandidateStage;
  roundIndex: number;
  rejectionReason: string | null;
  offeredCtc: number | null;
  joiningDate: string | null;
  hiredUserId: string | null;
  createdAt: string;
  interviews?: Interview[];
  opening?: Opening;
}

export const REC_LABEL: Record<Recommendation, string> = {
  strong_yes: "Strong yes",
  yes: "Yes",
  no: "No",
  strong_no: "Strong no",
};

export const REC_STYLE: Record<Recommendation, string> = {
  strong_yes: "bg-green-100 dark:bg-green-400/15 text-green-700 dark:text-green-300",
  yes: "bg-emerald-50 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-300",
  no: "bg-orange-100 dark:bg-orange-400/15 text-orange-700 dark:text-orange-300",
  strong_no: "bg-red-100 dark:bg-red-400/15 text-red-700 dark:text-red-300",
};

export const INR = (n: number | string | null | undefined) =>
  n == null || n === "" ? "—" : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export function stageLabel(c: Pick<Candidate, "stage" | "roundIndex">, rounds: Round[]) {
  if (c.stage === "interview") return rounds[c.roundIndex]?.name ?? `Round ${c.roundIndex + 1}`;
  return c.stage.charAt(0).toUpperCase() + c.stage.slice(1);
}

export async function openResume(candidateId: string) {
  const r = await hiringApi(`/candidates/${candidateId}/resume`);
  const data = await r.json().catch(() => ({}));
  if (r.ok && data.url) window.open(data.url, "_blank", "noopener");
  return r.ok;
}

export const inputCls = "w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
export const labelCls = "flex flex-col gap-1 text-sm font-medium text-foreground/85";
