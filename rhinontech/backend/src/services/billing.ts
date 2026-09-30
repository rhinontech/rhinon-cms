import { Organization, type OrganizationPlan, type OrganizationStatus } from "../models/Organization";
import { runAsSystem } from "./tenantContext";
import { trialEndDate } from "./usage";

/**
 * The single place a workspace's commercial state changes.
 *
 * Today it is driven by the platform team (routes/platformOrgs.ts). When a
 * payment provider is connected, its webhook handler calls this too — checkout
 * succeeded → applyPlan(org, "starter", { status: "active" }); subscription
 * lapsed → applyPlan(org, "free", { status: "trial" }) — and no enforcement code
 * has to change, because every limit reads the organization row.
 */
export interface PlanChange {
  plan?: OrganizationPlan;
  status?: OrganizationStatus;
  /** Extend or set the trial end. Pass null to remove the trial deadline. */
  trialEndsAt?: Date | null;
}

export async function applyPlan(organizationId: string, change: PlanChange): Promise<Organization | null> {
  return runAsSystem("billing:apply-plan", async () => {
    const org = await Organization.findByPk(organizationId);
    if (!org) return null;

    const settings = { ...(org.settings ?? {}) };
    if (change.trialEndsAt !== undefined) {
      if (change.trialEndsAt === null) delete settings.trialEndsAt;
      else settings.trialEndsAt = change.trialEndsAt.toISOString();
    }
    // A plan change answers any pending upgrade request.
    if (change.plan) delete settings.upgradeRequest;
    // Moving onto a paid state ends the trial clock.
    if (change.status === "active") delete settings.trialEndsAt;
    // Falling back onto a trial without a deadline would be unlimited free use.
    if (change.status === "trial" && !settings.trialEndsAt && change.trialEndsAt === undefined) {
      settings.trialEndsAt = trialEndDate().toISOString();
    }

    await org.update({
      ...(change.plan ? { plan: change.plan } : {}),
      ...(change.status ? { status: change.status } : {}),
      settings,
    });
    return org;
  });
}
