import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

// ─── Job opening ──────────────────────────────────────────────────────────────
// Each opening defines its own interview rounds; a candidate's progress is
// stage + roundIndex into that list, so renaming a round never orphans anyone.

export type OpeningStatus = "open" | "on_hold" | "closed";
export interface InterviewRoundDef { name: string }

interface JobOpeningAttributes {
  id: string;
  title: string;
  department?: string | null;
  location?: string | null;
  employmentType: string;
  positions: number;
  salaryMin?: number | null;
  salaryMax?: number | null;
  description?: string | null;
  rounds: InterviewRoundDef[];
  status: OpeningStatus;
  hiringManagerId?: string | null;
  createdById: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class JobOpening
  extends Model<JobOpeningAttributes, Optional<JobOpeningAttributes, "id" | "department" | "location" | "employmentType" | "positions" | "salaryMin" | "salaryMax" | "description" | "status" | "hiringManagerId">>
  implements JobOpeningAttributes
{
  declare id: string;
  declare title: string;
  declare department: string | null;
  declare location: string | null;
  declare employmentType: string;
  declare positions: number;
  declare salaryMin: number | null;
  declare salaryMax: number | null;
  declare description: string | null;
  declare rounds: InterviewRoundDef[];
  declare status: OpeningStatus;
  declare hiringManagerId: string | null;
  declare createdById: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

JobOpening.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    department: { type: DataTypes.STRING, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: true },
    employmentType: { type: DataTypes.STRING, allowNull: false, defaultValue: "Full-Time" },
    positions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    salaryMin: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    salaryMax: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    rounds: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    status: { type: DataTypes.ENUM("open", "on_hold", "closed"), allowNull: false, defaultValue: "open" },
    hiringManagerId: { type: DataTypes.UUID, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: false },
  },
  { sequelize, tableName: "job_openings", timestamps: true }
);

// ─── Candidate ────────────────────────────────────────────────────────────────

export const CANDIDATE_STAGES = ["applied", "shortlisted", "interview", "offer", "hired", "rejected", "withdrawn"] as const;
export type CandidateStage = (typeof CANDIDATE_STAGES)[number];

interface CandidateAttributes {
  id: string;
  openingId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  source?: string | null;
  linkedinUrl?: string | null;
  currentCtc?: number | null;
  expectedCtc?: number | null;
  noticePeriod?: string | null;
  resumeKey: string;
  resumeName: string;
  notes?: string | null;
  stage: CandidateStage;
  // Index into the opening's rounds; meaningful only while stage = "interview"
  roundIndex: number;
  rejectionReason?: string | null;
  offeredCtc?: number | null;
  joiningDate?: string | null;
  hiredUserId?: string | null;
  addedById: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Candidate
  extends Model<CandidateAttributes, Optional<CandidateAttributes, "id" | "phone" | "source" | "linkedinUrl" | "currentCtc" | "expectedCtc" | "noticePeriod" | "notes" | "stage" | "roundIndex" | "rejectionReason" | "offeredCtc" | "joiningDate" | "hiredUserId">>
  implements CandidateAttributes
{
  declare id: string;
  declare openingId: string;
  declare fullName: string;
  declare email: string;
  declare phone: string | null;
  declare source: string | null;
  declare linkedinUrl: string | null;
  declare currentCtc: number | null;
  declare expectedCtc: number | null;
  declare noticePeriod: string | null;
  declare resumeKey: string;
  declare resumeName: string;
  declare notes: string | null;
  declare stage: CandidateStage;
  declare roundIndex: number;
  declare rejectionReason: string | null;
  declare offeredCtc: number | null;
  declare joiningDate: string | null;
  declare hiredUserId: string | null;
  declare addedById: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Candidate.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    openingId: { type: DataTypes.UUID, allowNull: false },
    fullName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
    source: { type: DataTypes.STRING, allowNull: true },
    linkedinUrl: { type: DataTypes.STRING, allowNull: true },
    currentCtc: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    expectedCtc: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    noticePeriod: { type: DataTypes.STRING, allowNull: true },
    resumeKey: { type: DataTypes.STRING, allowNull: false },
    resumeName: { type: DataTypes.STRING, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    stage: { type: DataTypes.ENUM(...CANDIDATE_STAGES), allowNull: false, defaultValue: "applied" },
    roundIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    rejectionReason: { type: DataTypes.STRING(1000), allowNull: true },
    offeredCtc: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    joiningDate: { type: DataTypes.DATEONLY, allowNull: true },
    hiredUserId: { type: DataTypes.UUID, allowNull: true },
    addedById: { type: DataTypes.UUID, allowNull: false },
  },
  { sequelize, tableName: "candidates", timestamps: true }
);

// ─── Interview (one scheduled round for one candidate) ────────────────────────

export type InterviewStatus = "scheduled" | "completed" | "cancelled" | "no_show";
export type Recommendation = "strong_yes" | "yes" | "no" | "strong_no";

interface InterviewAttributes {
  id: string;
  candidateId: string;
  roundIndex: number;
  roundName: string;
  interviewerId: string;
  scheduledAt: Date;
  durationMins: number;
  meetingLink?: string | null;
  // Event on the shared Google Calendar (Meetings page); null when the calendar isn't connected
  calendarEventId?: string | null;
  calendarICalUID?: string | null;
  status: InterviewStatus;
  rating?: number | null;
  recommendation?: Recommendation | null;
  feedback?: string | null;
  feedbackAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Interview
  extends Model<InterviewAttributes, Optional<InterviewAttributes, "id" | "durationMins" | "meetingLink" | "calendarEventId" | "calendarICalUID" | "status" | "rating" | "recommendation" | "feedback" | "feedbackAt">>
  implements InterviewAttributes
{
  declare id: string;
  declare candidateId: string;
  declare roundIndex: number;
  declare roundName: string;
  declare interviewerId: string;
  declare scheduledAt: Date;
  declare durationMins: number;
  declare meetingLink: string | null;
  declare calendarEventId: string | null;
  declare calendarICalUID: string | null;
  declare status: InterviewStatus;
  declare rating: number | null;
  declare recommendation: Recommendation | null;
  declare feedback: string | null;
  declare feedbackAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Interview.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    candidateId: { type: DataTypes.UUID, allowNull: false },
    roundIndex: { type: DataTypes.INTEGER, allowNull: false },
    roundName: { type: DataTypes.STRING, allowNull: false },
    interviewerId: { type: DataTypes.UUID, allowNull: false },
    scheduledAt: { type: DataTypes.DATE, allowNull: false },
    durationMins: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 45 },
    meetingLink: { type: DataTypes.STRING(1000), allowNull: true },
    calendarEventId: { type: DataTypes.STRING, allowNull: true },
    calendarICalUID: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.ENUM("scheduled", "completed", "cancelled", "no_show"), allowNull: false, defaultValue: "scheduled" },
    rating: { type: DataTypes.INTEGER, allowNull: true },
    recommendation: { type: DataTypes.ENUM("strong_yes", "yes", "no", "strong_no"), allowNull: true },
    feedback: { type: DataTypes.TEXT, allowNull: true },
    feedbackAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: "interviews", timestamps: true }
);
