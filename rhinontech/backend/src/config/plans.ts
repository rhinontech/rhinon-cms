import type { OrganizationPlan } from "../models/Organization";

/**
 * What each plan includes. `null` means unlimited.
 *
 * These are enforced in one place each: seats when an employee is added
 * (routes/employees.ts), `emailsPerDay` just before an outreach/automation/compose
 * send (services/usage.ts), `aiPerDay` inside every Gemini call (services/gemini.ts).
 * The platform workspace (Rhinon itself) is never limited.
 *
 * The numbers are starting points, not commitments — change them here and every
 * enforcement point follows. A payment provider, when connected, only has to
 * call applyPlan() (services/billing.ts); nothing else needs to know about it.
 */
export interface PlanLimits {
  label: string;
  seats: number | null;
  emailsPerDay: number | null;
  aiPerDay: number | null;
  /**
   * How many of the workspace's own domains it may send from (instead of
   * <slug>.rhinontech.in). Each one belongs to a brand. Customers get at most one;
   * only the platform workspace — which runs several brands — is unlimited.
   */
  customDomains: number | null;
}

export const PLAN_LIMITS: Record<OrganizationPlan, PlanLimits> = {
  free: { label: "Free trial", seats: 5, emailsPerDay: 50, aiPerDay: 20, customDomains: 0 },
  starter: { label: "Starter", seats: 25, emailsPerDay: 500, aiPerDay: 200, customDomains: 1 },
  enterprise: { label: "Enterprise", seats: null, emailsPerDay: null, aiPerDay: null, customDomains: 1 },
};

export const TRIAL_DAYS = 14;

export type UsageKind = "email" | "ai";
