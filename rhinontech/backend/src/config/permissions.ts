import { Role, Permission, Organization } from "../models";

// Single source of truth for the permission catalog. The DB is synced to this
// list on every boot (additive only) — see syncPermissionCatalog below.
export const PERMISSION_CATALOG = [
  { name: "dashboard:read",     resource: "dashboard",    action: "read"  },
  { name: "employees:read",     resource: "employees",    action: "read"  },
  { name: "employees:write",    resource: "employees",    action: "write" },
  { name: "provisioning:read",  resource: "provisioning", action: "read"  },
  { name: "provisioning:write", resource: "provisioning", action: "write" },
  { name: "settings:read",      resource: "settings",     action: "read"  },
  { name: "settings:write",     resource: "settings",     action: "write" },
  { name: "inbox:read",         resource: "inbox",        action: "read"  },
  { name: "inbox:write",        resource: "inbox",        action: "write" },
  { name: "payroll:read",       resource: "payroll",      action: "read"  },
  { name: "payroll:write",      resource: "payroll",      action: "write" },
  { name: "payslips:read",      resource: "payslips",     action: "read"  },
  { name: "people:read",        resource: "people",       action: "read"  },
  { name: "outreach:read",      resource: "outreach",     action: "read"  },
  { name: "outreach:write",     resource: "outreach",     action: "write" },
  { name: "content:read",       resource: "content",      action: "read"  },
  { name: "content:write",      resource: "content",      action: "write" },
  { name: "analytics:read",     resource: "analytics",    action: "read"  },
  { name: "docsAccess:read",    resource: "docsAccess",   action: "read"  },
  { name: "docsAccess:write",   resource: "docsAccess",   action: "write" },
  { name: "leave:read",         resource: "leave",        action: "read"  },
  { name: "leave:write",        resource: "leave",        action: "write" },
  { name: "performance:read",   resource: "performance",  action: "read"  },
  { name: "performance:write",  resource: "performance",  action: "write" },
  { name: "documents:read",     resource: "documents",    action: "read"  },
  { name: "documents:write",    resource: "documents",    action: "write" },
  { name: "attendance:read",    resource: "attendance",   action: "read"  },
  { name: "attendance:write",   resource: "attendance",   action: "write" },
  { name: "work:read",          resource: "work",         action: "read"  },
  { name: "work:write",         resource: "work",         action: "write" },
  { name: "crm:read",           resource: "crm",          action: "read"  },
  { name: "crm:write",          resource: "crm",          action: "write" },
  { name: "pages:read",         resource: "pages",        action: "read"  },
  { name: "pages:write",        resource: "pages",        action: "write" },
  { name: "startupIdeas:read",  resource: "startupIdeas", action: "read"  },
  { name: "startupIdeas:write", resource: "startupIdeas", action: "write" },
  { name: "meetings:read",      resource: "meetings",     action: "read"  },
  { name: "meetings:write",     resource: "meetings",     action: "write" },
  // Deploy: read = see the build history, trigger = restart a backend.
  { name: "deploy:read",        resource: "deploy",       action: "read"  },
  { name: "deploy:trigger",     resource: "deploy",       action: "trigger" },
];

/**
 * Modules that operate Rhinon Tech itself and are never sold with a workspace.
 * A tenant's superadmin is never granted these, so the sidebar item does not
 * even render — the route guard (`requirePlatformOrg`) is the second line.
 *
 * Everything absent from this list IS part of the product, including Outreach,
 * CRM, Campaigns, LinkedIn and Inbox: a customer runs sales and mail out of
 * their own workspace, on their own domain.
 *
 * - provisioning: invites into Rhinon's OWN Slack workspace and GitHub org,
 *   from one server-level token. Nothing about it is per-tenant.
 * - content:      the CMS behind rhinonlabs.com and uppercurve.
 * - startupIdeas: submissions from Rhinon's /build campaign.
 * - docsAccess:   gating for Rhinon's own published docs.
 * - deploy:       restarts our backend processes.
 * - analytics:    rhinonlabs.com traffic.
 */
export const PLATFORM_ONLY_PERMISSIONS = new Set([
  "provisioning:read", "provisioning:write",
  "content:read", "content:write",
  "startupIdeas:read", "startupIdeas:write",
  "docsAccess:read", "docsAccess:write",
  "deploy:read", "deploy:trigger",
  "analytics:read",
]);

/** The catalog minus the platform modules — what a tenant superadmin holds. */
export function permissionsForOrg(isPlatform: boolean): string[] {
  const all = PERMISSION_CATALOG.map((p) => p.name);
  return isPlatform ? all : all.filter((name) => !PLATFORM_ONLY_PERMISSIONS.has(name));
}

// Grants applied only when a permission is FIRST created, preserving today's
// role behavior. Existing permissions are never re-granted, so revocations
// made from the Settings UI survive restarts.
export const DEFAULT_ROLE_GRANTS: Record<string, string[]> = {
  hr: [
    "leave:read", "leave:write",
    "performance:read", "performance:write",
    "documents:read", "documents:write",
    "attendance:read",
    "work:read",
    // The support@rhinon.tech calendar is company-wide reference — everyone can see it,
    // but only superadmin gets meetings:write by default (grant it per role in Settings).
    "meetings:read",
  ],
  employee: [
    "leave:read",
    "performance:read",
    "documents:read",
    "attendance:read",
    "work:read",
    "meetings:read",
  ],
};

// Idempotent, additive catalog sync. Runs on every boot:
// - creates any catalog permissions missing from the DB
// - each org's superadmin accumulates the catalog its org is entitled to:
//   the full list for the platform org, minus PLATFORM_ONLY_PERMISSIONS for tenants
// - DEFAULT_ROLE_GRANTS apply only to newly created permissions
export async function syncPermissionCatalog() {
  const results = await Promise.all(
    PERMISSION_CATALOG.map((p) =>
      Permission.findOrCreate({ where: { name: p.name }, defaults: p })
    )
  );
  const allPerms = results.map(([perm]) => perm);
  const createdPerms = results.filter(([, created]) => created).map(([perm]) => perm);

  // findAll, not findOne: every organization has its own superadmin role, and
  // a new catalog entry has to reach all of them. Runs under system context at
  // boot, so this deliberately crosses tenants.
  const superadmins = await Role.findAll({ where: { slug: "superadmin" } });
  const platformOrgIds = new Set(
    (await Organization.findAll({ where: { isPlatform: true } })).map((org) => org.id)
  );
  for (const superadmin of superadmins) {
    // organizationId is installed on tenant models at runtime by tenantScope,
    // so it is not on the declared Role type.
    const orgId = superadmin.get("organizationId") as string | null;
    const allowed = new Set(permissionsForOrg(Boolean(orgId && platformOrgIds.has(orgId))));
    const grant = allPerms.filter((p) => allowed.has(p.name));
    await (superadmin as any).addPermissions(grant);

    // Revoke, not just withhold: tenant superadmins created before this split
    // already hold the platform grants — deploy:trigger among them.
    const revoke = allPerms.filter((p) => !allowed.has(p.name));
    if (revoke.length) await (superadmin as any).removePermissions(revoke);
  }

  if (createdPerms.length > 0) {
    for (const [slug, grantNames] of Object.entries(DEFAULT_ROLE_GRANTS)) {
      const roles = await Role.findAll({ where: { slug } });
      const toGrant = createdPerms.filter((p) => grantNames.includes(p.name));
      if (toGrant.length === 0) continue;
      for (const role of roles) {
        await (role as any).addPermissions(toGrant);
      }
    }
    console.log(`[Permissions] Catalog sync: created ${createdPerms.map((p) => p.name).join(", ")}`);
  }

  return { total: allPerms.length, created: createdPerms.length };
}
