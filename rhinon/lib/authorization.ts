import type { SessionUser } from "@/lib/types";

export const ROLE_SLUGS = [
  "super_admin",
  "admin",
  "manager",
  "sales",
  "marketer",
  "support",
] as const;

export type RoleSlug = (typeof ROLE_SLUGS)[number];

export const CAPABILITIES = [
  "manage_users",
  "invite_users",
  "manage_mailboxes",
  "switch_primary_identity",
  "manage_leads",
  "send_email",
  "manage_campaigns",
  "launch_campaigns",
  "manage_templates",
  "manage_social_posts",
  "publish_social_posts",
  "manage_settings",
  "view_audit_logs",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const ROLE_CAPABILITIES: Record<RoleSlug, Capability[]> = {
  super_admin: [...CAPABILITIES],
  admin: [...CAPABILITIES],
  manager: [
    "manage_leads",
    "send_email",
    "manage_campaigns",
    "launch_campaigns",
    "manage_templates",
    "manage_social_posts",
    "publish_social_posts",
    "manage_settings",
  ],
  sales: ["manage_leads", "send_email", "manage_campaigns", "manage_templates"],
  marketer: ["manage_templates", "manage_social_posts", "publish_social_posts", "manage_campaigns"],
  support: ["send_email", "manage_settings"],
};

export function hasCapability(user: SessionUser | null | undefined, capability: Capability): boolean {
  if (!user) return false;
  return user.capabilities.includes(capability);
}

export function requireCapability(user: SessionUser | null | undefined, capability: Capability): { ok: true } | { ok: false; status: number; error: string } {
  if (!user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  if (!hasCapability(user, capability)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true };
}
