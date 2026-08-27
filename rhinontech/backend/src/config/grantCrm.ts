import { sequelize } from "./database";
import { Role, Permission } from "../models";

/**
 * Grants the CRM permissions to a role.
 *
 * `DEFAULT_ROLE_GRANTS` only applies the first time a permission row is created,
 * so it can't help here — crm:read/crm:write already exist from an earlier boot
 * but were never granted to anyone. This is the targeted, idempotent alternative
 * to re-running the full seed (which overwrites the seeded superadmin profile).
 *
 *   npm run grant:crm -- hr
 *   npm run grant:crm -- hr --read-only
 */
async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith("--"));
  const readOnly = args.includes("--read-only");

  if (!slug) {
    console.error("Usage: npm run grant:crm -- <role-slug> [--read-only]");
    process.exit(1);
  }

  await sequelize.authenticate();

  const role = await Role.findOne({ where: { slug } });
  if (!role) {
    const all = await Role.findAll({ attributes: ["slug"] });
    console.error(`No role "${slug}". Available: ${all.map((r) => r.slug).join(", ")}`);
    process.exit(1);
  }

  const wanted = readOnly ? ["crm:read"] : ["crm:read", "crm:write"];
  const permissions = await Permission.findAll({
    where: { resource: "crm" },
  });
  const target = permissions.filter((p) => wanted.includes(`${p.resource}:${p.action}`));

  if (target.length === 0) {
    console.error("CRM permissions not found — start the server once so the catalog syncs.");
    process.exit(1);
  }

  // addPermissions is additive and ignores ones already granted.
  await (role as any).addPermissions(target);

  console.log(
    `Granted ${target.map((p) => `${p.resource}:${p.action}`).join(", ")} to "${slug}".\n` +
    "Permissions resolve per request, so a page refresh is enough — no re-login needed."
  );
  await sequelize.close();
}

main().catch((err) => {
  console.error("grant:crm failed:", err.message);
  process.exit(1);
});
