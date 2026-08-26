export type LeadStatus =
  | "New" | "Enriched" | "Enrolled" | "Emailed"
  | "Replied" | "Bounced" | "Unsubscribed" | "Interested";

/** Human-owned funnel. Distinct from `status`, which the outreach cron writes. */
export type LifecycleStage =
  | "New" | "Contacted" | "Engaged" | "Qualified" | "Unqualified" | "Customer";

export const LIFECYCLE_STAGES: LifecycleStage[] = [
  "New", "Contacted", "Engaged", "Qualified", "Unqualified", "Customer",
];

export interface UserRef {
  id: string;
  fullName: string;
  companyEmail?: string;
}

export interface AccountRef {
  id: string;
  name: string;
  domain: string | null;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  title: string | null;
  email: string;
  phone?: string | null;
  linkedinUrl: string | null;
  status: LeadStatus;
  lifecycleStage: LifecycleStage;
  ownerId: string | null;
  owner?: UserRef | null;
  accountId: string | null;
  account?: AccountRef | null;
  lastActivityAt?: string | null;
  campaignId: string | null;
  campaign?: { name: string };
  source: string;
  notes: string | null;
  addedAt: string;
  seniority?: string | null;
  department?: string | null;
  industry?: string | null;
  employeeCount?: number | null;
  location?: string | null;
  website?: string | null;
  companyLinkedinUrl?: string | null;
  emailStatus?: string | null;
  technologies?: string | null;
  annualRevenue?: string | null;
  raw?: Record<string, string> | null;
  enrichment?: Record<string, unknown> | null;
  // Present only on GET /leads/:id, which includes the related records.
  deals?: Deal[];
  tasks?: { id: string; title: string; status: string; dueDate?: string | null }[];
}

export interface Account {
  id: string;
  name: string;
  domain: string | null;
  website: string | null;
  industry: string | null;
  employeeCount: number | null;
  annualRevenue: string | null;
  location: string | null;
  linkedinUrl: string | null;
  phone: string | null;
  description: string | null;
  ownerId: string | null;
  owner?: UserRef | null;
  contactCount?: number;
  openDealCount?: number;
  openDealValue?: number;
  contacts?: Lead[];
  deals?: Deal[];
}

export type StageType = "Open" | "Won" | "Lost";

export interface PipelineStage {
  id: string;
  name: string;
  position: number;
  probability: number;
  type: StageType;
  color: string | null;
}

export interface Deal {
  id: string;
  title: string;
  accountId: string | null;
  account?: AccountRef | null;
  primaryLeadId: string | null;
  primaryLead?: { id: string; name: string; email: string; title: string | null } | null;
  ownerId: string | null;
  owner?: UserRef | null;
  value: string | number;
  currency: string;
  stageId: string | null;
  stage?: PipelineStage | null;
  status: StageType;
  expectedCloseDate: string | null;
  closedAt: string | null;
  lostReason: string | null;
  source: string | null;
  notes: string | null;
  updatedAt?: string;
}

export interface BoardStage extends PipelineStage {
  deals: Deal[];
  dealCount: number;
  totalValue: number;
  weightedValue: number;
}

export type TimelineKind = "activity" | "campaign" | "email";

export interface TimelineEntry {
  id: string;
  kind: TimelineKind;
  type: string;
  subject: string | null;
  body: string | null;
  occurredAt: string;
  direction?: string | null;
  durationMinutes?: number | null;
  user?: { id: string; fullName: string } | null;
  metadata?: Record<string, unknown> | null;
}
