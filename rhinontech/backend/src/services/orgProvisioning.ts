import crypto from "crypto";
import { Role, Permission, Organization, PipelineStage, WorkflowStatus, Site } from "../models";
import { DEFAULT_STAGES } from "../models/PipelineStage";
import { DEFAULT_STATUSES } from "../config/seedWorkflow";
import { PERMISSION_CATALOG, DEFAULT_ROLE_GRANTS } from "../config/permissions";
import type { Transaction } from "sequelize";
import { runForOrg } from "./tenantContext";

/**
 * Everything a brand-new organization needs before its first login.
 *
 * The single-tenant equivalents of these ran once at boot and returned early if
 * ANY row existed — seedPipelineStages() counted globally, ensureCollaboratorRole()
 * did findOrCreate on a bare slug. Left as they were, organization #2 would land
 * in a half-built workspace: no deal stages, no board columns, and a
 * "collaborator" role belonging to somebody else's tenant.
 */

/**
 * Slugs we will not hand out. The infrastructure names would collide with our
 * own subdomains; the brand names are the phishing vector — the whole point of
 * this design is that we DKIM-sign every tenant's mail, so `billing@hdfc.
 * rhinontech.in` would be an attacker sending bank mail with our signature.
 */
export const RESERVED_SLUGS = new Set([
  // platform infrastructure
  "api", "www", "mail", "smtp", "imap", "pop", "ftp", "ns", "ns1", "ns2", "mx",
  "admin", "app", "apps", "dashboard", "portal", "beta", "staging", "dev", "test",
  "static", "assets", "cdn", "img", "images", "media", "files", "download",
  "support", "help", "status", "docs", "blog", "careers", "jobs", "about",
  "rhinon", "rhinontech", "rhinonlabs", "uppercurve", "internal", "system",
  "auth", "login", "signup", "account", "accounts", "billing", "payments",
  "security", "abuse", "postmaster", "webmaster", "hostmaster", "noreply",
  // commonly impersonated brands
  "hdfc", "icici", "sbi", "axis", "kotak", "paytm", "phonepe", "gpay",
  "google", "microsoft", "apple", "amazon", "paypal", "stripe", "razorpay",
  "netflix", "meta", "facebook", "instagram", "whatsapp", "linkedin",
]);

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/;

export function validateSlug(slug: string): { ok: true } | { ok: false; reason: string } {
  const value = (slug || "").trim().toLowerCase();
  if (!value) return { ok: false, reason: "Workspace name is required." };
  if (value.length < 3) return { ok: false, reason: "Workspace name must be at least 3 characters." };
  if (value.length > 32) return { ok: false, reason: "Workspace name must be 32 characters or fewer." };
  if (!SLUG_PATTERN.test(value)) {
    return {
      ok: false,
      reason: "Use lowercase letters, numbers and hyphens only, starting and ending with a letter or number.",
    };
  }
  // A slug with two dots' worth of hyphens is fine, but `--` reads as a Punycode
  // prefix to some mail clients and trips homograph warnings.
  if (value.includes("--")) return { ok: false, reason: "Workspace name cannot contain a double hyphen." };
  if (RESERVED_SLUGS.has(value)) return { ok: false, reason: "That workspace name is reserved." };
  return { ok: true };
}

export function emailDomainFor(slug: string): string {
  const platform = process.env.PLATFORM_EMAIL_DOMAIN || "rhinontech.in";
  return `${slug}.${platform}`;
}

/**
 * Public API key. Only the hash is stored — the plaintext is shown once, at
 * creation or rotation, the way every other API product does it.
 */
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const secret = crypto.randomBytes(24).toString("base64url");
  const key = `rh_live_${secret}`;
  return {
    key,
    hash: crypto.createHash("sha256").update(key).digest("hex"),
    prefix: key.slice(0, 16),
  };
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/** The four roles every org starts with, and what each may reach. */
function roleDefinitions(permissionNames: string[]) {
  return [
    { slug: "superadmin", name: "Super Admin", grants: permissionNames },
    {
      slug: "hr",
      name: "HR",
      grants: [
        "dashboard:read", "employees:read", "employees:write", "people:read",
        "payroll:read", "payroll:write", "payslips:read",
        ...DEFAULT_ROLE_GRANTS.hr,
      ],
    },
    {
      slug: "employee",
      name: "Employee",
      grants: ["dashboard:read", "payslips:read", "people:read", ...DEFAULT_ROLE_GRANTS.employee],
    },
    // External collaborators. work:read is not a privilege — it is the key to
    // the route guards the client portal cannot function without. Their real
    // limits are GUEST_ALLOWED_MOUNTS, the ProjectMember allowlist and
    // Task.guestVisible; hasPermission() hard-returns false for guests.
    { slug: "collaborator", name: "Collaborator", grants: ["work:read"] },
  ];
}

export interface ProvisionResult {
  rolesCreated: string[];
  stagesCreated: number;
  statusesCreated: number;
  siteCreated: boolean;
}

/**
 * Idempotent. Safe on every boot for every existing org, and called once for
 * each new org at signup.
 */
export async function provisionOrganizationDefaults(
  organizationId: string,
  transaction?: Transaction
): Promise<ProvisionResult> {
  return runForOrg(organizationId, async () => {
    const permissions = await Permission.findAll({ transaction });
    const byName = new Map(permissions.map((p) => [p.name, p]));
    const allNames = PERMISSION_CATALOG.map((p) => p.name);

    const rolesCreated: string[] = [];
    for (const def of roleDefinitions(allNames)) {
      const [role, created] = await Role.findOrCreate({
        where: { slug: def.slug },
        defaults: { name: def.name, slug: def.slug } as never,
        transaction,
      });
      if (created) {
        rolesCreated.push(def.slug);
        const grants = def.grants.map((n) => byName.get(n)).filter(Boolean);
        await (role as never as {
          setPermissions(p: unknown[], o?: unknown): Promise<void>;
        }).setPermissions(grants, { transaction });
      }
    }

    // Deal pipeline. The old version returned early if ANY org had stages.
    let stagesCreated = 0;
    if ((await PipelineStage.count({ transaction })) === 0) {
      const rows = await PipelineStage.bulkCreate(DEFAULT_STAGES as never[], { transaction });
      stagesCreated = rows.length;
    }

    // Board columns (the company-wide default set, projectId null).
    let statusesCreated = 0;
    for (const def of DEFAULT_STATUSES) {
      const [, created] = await WorkflowStatus.findOrCreate({
        where: { projectId: null, name: def.name },
        defaults: { ...def, projectId: null, isDefault: def.isDefault ?? false } as never,
        transaction,
      });
      if (created) statusesCreated++;
    }

    // One publishing site, so a new workspace writes blogs without ever being
    // shown a brand picker. Orgs that later want two brands add a second site.
    //
    // Guarded on "has no sites at all", not on the "main" slug: this runs for
    // every org on every boot, and keying it to the slug added a third site to
    // the platform org (which already has rhinonlabs + uppercurve) and left TWO
    // rows flagged isDefault — making which site bare /public/blogs reads a coin
    // flip, and rhinonlabs.com's blog list flaky.
    const existingSites = await Site.count({ transaction });
    let siteCreated = false;
    if (existingSites === 0) {
      const org = await Organization.findByPk(organizationId, { transaction });
      await Site.create(
        {
          name: org?.name ?? "Main site",
          slug: "main",
          isDefault: true,
          supportsEvents: true,
          supportsCaseStudies: true,
        } as never,
        { transaction }
      );
      siteCreated = true;
    }

    return { rolesCreated, stagesCreated, statusesCreated, siteCreated };
  });
}

/** Brings every existing org up to the current default set. Runs at boot. */
export async function provisionAllOrganizations(): Promise<number> {
  const orgs = await Organization.findAll({ attributes: ["id"] });
  let touched = 0;
  for (const org of orgs) {
    const result = await provisionOrganizationDefaults(org.id);
    if (result.rolesCreated.length || result.stagesCreated || result.statusesCreated || result.siteCreated) touched++;
  }
  return touched;
}
