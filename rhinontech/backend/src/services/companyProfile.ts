import { Organization } from "../models/Organization";
import { currentOrganizationId, runAsSystem } from "./tenantContext";
import { getSalesMemory } from "../config/salesMemory";

/**
 * Who the AI and the outbound email are speaking AS.
 *
 * The platform workspace (Rhinon itself) keeps its bundled sales brain. Every
 * other workspace is a different company: its drafts must describe ITS business,
 * and where it has not said what that is yet, the model is told to stay inside
 * the lead and template it was given instead of pitching Rhinon's services,
 * ICP or case studies to someone else's prospects.
 */
export interface CompanyProfile {
  organizationId: string | null;
  isPlatform: boolean;
  /** Name to sign and describe the company with. */
  name: string;
  /** The knowledge block injected into prompts. */
  knowledge: string;
  /** True once the workspace has written its own knowledge (always true for the platform). */
  configured: boolean;
  /** The workspace's mail domain, e.g. acme.rhinontech.in. */
  emailDomain: string | null;
  /** Postal address for the compliance line in outbound mail footers, if the workspace set one. */
  address: string | null;
}

const PLATFORM_NAME = "Rhinon Labs";

function genericKnowledge(name: string): string {
  return `# ${name.toUpperCase()} — SALES AGENT MEMORY

No company knowledge has been configured for ${name} yet.

Rules until it is:
- Write only from the lead context, the template and the instructions you are given.
- Do NOT invent services, products, pricing, customers, case studies, results or statistics for ${name}.
- Do NOT mention any other company by name as the sender, and never describe ${name} as offering anything that was not stated above.
- If something needed to write a credible email is missing, keep the claim general or ask a question instead.
- Never fabricate facts. Prefer concise emails under 120 words. Write as a business operator, not a salesperson.`;
}

export async function getCompanyProfile(organizationId: string | null = currentOrganizationId()): Promise<CompanyProfile> {
  const org = organizationId
    ? await runAsSystem("company-profile", () => Organization.findByPk(organizationId))
    : null;

  if (org?.isPlatform) {
    return { organizationId: org.id, isPlatform: true, name: PLATFORM_NAME, knowledge: getSalesMemory(), configured: true, emailDomain: org.emailDomain, address: org.settings?.address ?? null };
  }

  const name = (org?.settings?.displayName || org?.name || "our company").trim();
  const custom = (org?.settings?.companyKnowledge || "").trim();
  return {
    organizationId: org?.id ?? null,
    isPlatform: false,
    name,
    knowledge: custom || genericKnowledge(name),
    configured: !!custom,
    emailDomain: org?.emailDomain ?? null,
    address: org?.settings?.address ?? null,
  };
}

/**
 * Sender-name fallback for outbound mail when neither the campaign nor the
 * sending user supplies one. Used to be the literal string "Rhinon Team".
 */
export async function defaultSenderName(): Promise<string> {
  const profile = await getCompanyProfile();
  return `${profile.name} Team`;
}

/**
 * Branding for account emails (welcome, password reset, payslip, signing). The
 * platform keeps the "Rhinon Tech" name those emails always carried; a tenant
 * gets its own.
 */
export async function transactionalBrand(organizationId: string | null = currentOrganizationId()) {
  const profile = await getCompanyProfile(organizationId);
  return {
    name: profile.isPlatform ? "Rhinon Tech" : profile.name,
    isPlatform: profile.isPlatform,
    address: profile.address,
  };
}

/**
 * Last-resort "From" address when a campaign, a user and the campaign's creator
 * all lack one. It used to be the literal admin@rhinontech.in for everybody —
 * which sends one customer's mail as the platform. A workspace falls back to its
 * own domain instead.
 */
export async function fallbackFromAddress(organizationId: string | null = currentOrganizationId()): Promise<string> {
  const profile = await getCompanyProfile(organizationId);
  if (profile.isPlatform || !profile.emailDomain) return "admin@rhinontech.in";
  return `admin@${profile.emailDomain}`;
}
