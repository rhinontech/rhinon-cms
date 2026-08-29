import { Role, Permission } from "../models";

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
// - superadmin always accumulates the full catalog (addPermissions, never set)
// - DEFAULT_ROLE_GRANTS apply only to newly created permissions
export async function syncPermissionCatalog() {
  const results = await Promise.all(
    PERMISSION_CATALOG.map((p) =>
      Permission.findOrCreate({ where: { name: p.name }, defaults: p })
    )
  );
  const allPerms = results.map(([perm]) => perm);
  const createdPerms = results.filter(([, created]) => created).map(([perm]) => perm);

  const superadmin = await Role.findOne({ where: { slug: "superadmin" } });
  if (superadmin) {
    await (superadmin as any).addPermissions(allPerms);
  }

  if (createdPerms.length > 0) {
    for (const [slug, grantNames] of Object.entries(DEFAULT_ROLE_GRANTS)) {
      const role = await Role.findOne({ where: { slug } });
      if (!role) continue;
      const toGrant = createdPerms.filter((p) => grantNames.includes(p.name));
      if (toGrant.length > 0) {
        await (role as any).addPermissions(toGrant);
      }
    }
    console.log(`[Permissions] Catalog sync: created ${createdPerms.map((p) => p.name).join(", ")}`);
  }

  return { total: allPerms.length, created: createdPerms.length };
}
