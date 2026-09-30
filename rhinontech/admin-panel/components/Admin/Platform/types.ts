export type PlanId = "free" | "starter" | "enterprise";
export type OrgStatus = "active" | "trial" | "suspended";

/** One row of the platform's workspace list (GET /platform/organizations). */
export interface OrgRow {
  id: string;
  name: string;
  slug: string;
  emailDomain: string;
  plan: PlanId;
  status: OrgStatus;
  isPlatform: boolean;
  trialEndsAt: string | null;
  trialExpired: boolean;
  emailVerificationPending: boolean;
  upgradeRequest: { plan: string; note: string | null; at: string; by: string } | null;
  deletionScheduledFor: string | null;
  createdAt: string;
  seats?: number;
}

export interface OrgUsage {
  plan: PlanId;
  planLabel: string;
  status: OrgStatus;
  seats: { used: number; limit: number | null };
  emailsToday: { used: number; limit: number | null };
  aiToday: { used: number; limit: number | null };
}

export interface AuditEntry {
  id: string;
  actorName: string | null;
  action: string;
  createdAt: string;
  ip: string | null;
}

export interface OrgDomain {
  domain: string;
  status: "pending" | "verified" | "failed";
}

/** GET /platform/organizations/:id — what support needs on one screen. */
export interface OrgDetail extends OrgRow {
  usage: OrgUsage | null;
  owner: { name: string; email: string; companyEmail: string } | null;
  customDomain: { domains: OrgDomain[]; limit: number | null };
  deletion: { scheduled: boolean; scheduledFor: string | null; requestedAt: string | null; graceDays: number };
  terms: { accepted: string | null; acceptedAt: string | null };
  recentAudit: AuditEntry[];
}

/** Needs a human: something the platform team is expected to act on. */
export const needsAttention = (o: OrgRow) =>
  !o.isPlatform && (!!o.upgradeRequest || o.trialExpired || !!o.deletionScheduledFor);
