import crypto from "crypto";
import { QueryTypes } from "sequelize";
import { sequelize } from "../config/database";
import { Organization } from "../models/Organization";
import { UsageCounter } from "../models/UsageCounter";
import { User } from "../models/User";
import { PLAN_LIMITS, TRIAL_DAYS, type PlanLimits, type UsageKind } from "../config/plans";
import { currentOrganizationId, runAsSystem } from "./tenantContext";

/**
 * Plan enforcement: metered usage, seats and trial state.
 *
 * The platform workspace is exempt from every limit. So is any workspace that has
 * no trial end recorded — orgs that existed before plans did are grandfathered
 * rather than locked out the day this ships.
 */

/** Thrown when a workspace has used up what its plan includes. Mapped to HTTP 402. */
export class PlanLimitError extends Error {
  status = 402;
  code = "PLAN_LIMIT";
  constructor(message: string, public limit: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

/** Answers 402 for a PlanLimitError and leaves every other error to the caller. */
export function isPlanLimitError(err: unknown): err is PlanLimitError {
  return err instanceof PlanLimitError;
}

export interface OrgPlanState {
  organizationId: string;
  isPlatform: boolean;
  plan: Organization["plan"];
  status: Organization["status"];
  limits: PlanLimits;
  trialEndsAt: Date | null;
  trialExpired: boolean;
}

export function planState(org: Organization): OrgPlanState {
  const raw = org.settings?.trialEndsAt;
  const trialEndsAt = raw ? new Date(raw) : null;
  const trialExpired = !org.isPlatform && org.status === "trial" && !!trialEndsAt && trialEndsAt.getTime() < Date.now();
  // Platform is unlimited whatever its plan column says.
  const limits: PlanLimits = org.isPlatform
    ? { label: "Platform", seats: null, emailsPerDay: null, aiPerDay: null, customDomains: null }
    : PLAN_LIMITS[org.plan] ?? PLAN_LIMITS.free;
  return { organizationId: org.id, isPlatform: org.isPlatform, plan: org.plan, status: org.status, limits, trialEndsAt, trialExpired };
}

async function loadState(organizationId: string): Promise<OrgPlanState | null> {
  const org = await runAsSystem("usage:plan-state", () => Organization.findByPk(organizationId));
  return org ? planState(org) : null;
}

export function trialEndDate(from = new Date()): Date {
  return new Date(from.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

const FOREVER = 2_147_483_647;

/**
 * Counts one unit of `kind` against today's allowance, or refuses.
 *
 * One atomic upsert: the `WHERE count < limit` on the conflict branch is what
 * stops two concurrent sends from both taking the last slot. Days roll over at
 * midnight IST, which is when an Indian business expects "today" to reset.
 * Returns null when allowed, or a human reason when not.
 */
export async function reserveUsage(kind: UsageKind, organizationId: string | null = currentOrganizationId()): Promise<string | null> {
  if (!organizationId) return null;
  const state = await loadState(organizationId);
  if (!state || state.isPlatform) return null;

  if (state.trialExpired) return "Your trial has ended. Upgrade your plan to continue.";

  const limit = kind === "email" ? state.limits.emailsPerDay : state.limits.aiPerDay;
  const rows = await sequelize.query<{ count: number }>(
    `INSERT INTO usage_counters (id, "organizationId", kind, day, count, "createdAt", "updatedAt")
     VALUES (:id, :org, :kind, (now() AT TIME ZONE 'Asia/Kolkata')::date, 1, now(), now())
     ON CONFLICT ("organizationId", kind, day)
     DO UPDATE SET count = usage_counters.count + 1, "updatedAt" = now()
       WHERE usage_counters.count < :limit
     RETURNING count`,
    { replacements: { id: crypto.randomUUID(), org: organizationId, kind, limit: limit ?? FOREVER }, type: QueryTypes.SELECT }
  );

  if (rows.length > 0) return null;
  const what = kind === "email" ? "outbound emails" : "AI generations";
  return `Daily limit of ${limit} ${what} reached for the ${state.limits.label} plan. It resets at midnight IST.`;
}

/** Throwing form of reserveUsage, for code that has no natural way to return a reason. */
export async function requireUsage(kind: UsageKind): Promise<void> {
  const reason = await reserveUsage(kind);
  if (reason) throw new PlanLimitError(reason, kind === "email" ? "emailsPerDay" : "aiPerDay");
}

/** Null when one more active employee fits the plan, else the reason it does not. */
export async function seatBlockedReason(organizationId: string | null = currentOrganizationId()): Promise<string | null> {
  if (!organizationId) return null;
  const state = await loadState(organizationId);
  if (!state || state.isPlatform) return null;
  if (state.trialExpired) return "Your trial has ended. Upgrade your plan to add people.";
  if (state.limits.seats === null) return null;

  // External collaborators (userType "guest") are clients on a project, not seats.
  const used = await User.count({ where: { status: "active", userType: "internal" } });
  return used >= state.limits.seats
    ? `The ${state.limits.label} plan includes ${state.limits.seats} people and this workspace has ${used}. Upgrade to add more.`
    : null;
}

export interface UsageSummary {
  plan: Organization["plan"];
  planLabel: string;
  status: Organization["status"];
  trialEndsAt: Date | null;
  trialExpired: boolean;
  seats: { used: number; limit: number | null };
  emailsToday: { used: number; limit: number | null };
  aiToday: { used: number; limit: number | null };
}

export async function usageSummary(organizationId: string): Promise<UsageSummary | null> {
  const state = await loadState(organizationId);
  if (!state) return null;

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const counters = await UsageCounter.findAll({ where: { day: today } });
  const used = (kind: UsageKind) => counters.find((c) => c.kind === kind)?.count ?? 0;

  return {
    plan: state.plan,
    planLabel: state.limits.label,
    status: state.status,
    trialEndsAt: state.trialEndsAt,
    trialExpired: state.trialExpired,
    seats: { used: await User.count({ where: { status: "active", userType: "internal" } }), limit: state.limits.seats },
    emailsToday: { used: used("email"), limit: state.limits.emailsPerDay },
    aiToday: { used: used("ai"), limit: state.limits.aiPerDay },
  };
}
