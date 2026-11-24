import { ProductEvent } from "../models";
import { currentOrganizationId, runForOrg } from "./tenantContext";

/**
 * Product events for the activation funnel (signed up → invited → first
 * campaign / project / chatbot). Fire-and-forget: recording must never slow
 * down or fail the action it describes.
 */
export type ProductEventName =
  | "signup" | "invite_sent" | "contacts_imported" | "deal_created" | "deal_won"
  | "project_created" | "chatbot_installed" | "plan_blocked" | "onboarding_goal"
  // Reported by the browser through POST /home/events:
  | ClientEventName;

/** The only events the browser may report — anything else is ignored. */
export const CLIENT_EVENTS = ["upgrade_clicked", "search_used", "home_attention_clicked", "home_quick_action"] as const;
export type ClientEventName = (typeof CLIENT_EVENTS)[number];

export function trackEvent(event: ProductEventName, userId: string | null, props?: Record<string, unknown>, organizationId?: string): void {
  const write = () => ProductEvent.create({ event, userId, props: props ?? null });
  const orgId = organizationId ?? currentOrganizationId();
  if (!orgId) return;
  const run = organizationId ? runForOrg(organizationId, write) : write();
  void Promise.resolve(run).catch((err: Error) => console.error(`[Events] ${event} not recorded:`, err.message));
}
