/**
 * Creates the single superadmin of the PLATFORM organization (Rhinon Tech).
 *
 * Every other workspace is born through `POST /auth/signup`, which builds its
 * own org, roles and first superadmin in one transaction. The platform org
 * cannot come that way: its slug is reserved, and the boot migration has
 * already created the row — so signup would answer "that workspace name is
 * taken". Without this script a fresh database has a Rhinon Tech org with zero
 * users and no way in.
 *
 * `db:seed` cannot stand in for it. That script predates tenancy: it looks
 * roles up by bare slug and creates the user with no organization at all, which
 * under the tenant hooks means a row belonging to nobody.
 *
 * Addresses follow the same rule as everywhere else — the address is built from
 * the org's own emailDomain, and the platform org holds the apex. So Rhinon
 * Tech people are <prefix>@rhinontech.in while a tenant's are
 * <prefix>@<slug>.rhinontech.in. Nothing here special-cases that; it falls out
 * of PLATFORM_ORG.emailDomain.
 *
 *   npm run db:bootstrap
 *   BOOTSTRAP_EMAIL=... BOOTSTRAP_NAME="..." BOOTSTRAP_PASSWORD=... npm run db:bootstrap
 */
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sequelize } from "./database";
import { Organization, Role, User } from "../models";
import { runAsSystem, runForOrg } from "../services/tenantContext";
import { provisionOrganizationDefaults } from "../services/orgProvisioning";

const NAME = process.env.BOOTSTRAP_NAME || "Prabhat Patra";
const PERSONAL_EMAIL = (process.env.BOOTSTRAP_EMAIL || "prabhatpatra24@gmail.com").toLowerCase();
const PREFIX = (process.env.BOOTSTRAP_PREFIX || NAME.trim().split(/\s+/)[0] || "admin")
  .replace(/[^a-z0-9._-]/gi, "")
  .toLowerCase();

/** Matches the signup rules in routes/auth.ts: 8+ chars, an uppercase, a digit. */
function generatePassword(): string {
  return `Rh${crypto.randomBytes(9).toString("base64url")}7`;
}

async function bootstrap() {
  await sequelize.authenticate();

  const org = await runAsSystem("bootstrap:find-platform-org", () =>
    Organization.findOne({ where: { isPlatform: true } })
  );

  if (!org) {
    throw new Error(
      "No platform organization exists yet. Start the server once — the boot " +
        "migration creates it — then run this again."
    );
  }

  // Idempotent, and the roles may predate the current permission catalog.
  await provisionOrganizationDefaults(org.id);

  await runForOrg(org.id, async () => {
    const superadminRole = await Role.findOne({ where: { slug: "superadmin" } });
    if (!superadminRole) {
      throw new Error(`Organization ${org.slug} has no superadmin role to assign.`);
    }

    const companyEmail = `${PREFIX}@${org.emailDomain}`;
    const existing = await User.findAll();
    const mine = existing.find(
      (user) => user.companyEmail === companyEmail || user.personalEmail === PERSONAL_EMAIL
    );
    const others = existing.filter((user) => user.id !== mine?.id);

    // "Only me" is the point of this script, so a second account in the
    // platform org is reported rather than quietly added to.
    if (others.length) {
      console.warn(
        `\n  ${org.name} already has ${others.length} other user(s):\n` +
          others.map((user) => `    - ${user.fullName} <${user.companyEmail}>`).join("\n") +
          `\n  Leaving them alone. Remove them yourself if this org is meant to hold only you.\n`
      );
    }

    const password = process.env.BOOTSTRAP_PASSWORD || generatePassword();
    const passwordProblem =
      password.length < 8
        ? "at least 8 characters"
        : !/[A-Z]/.test(password)
          ? "an uppercase letter"
          : !/[0-9]/.test(password)
            ? "a number"
            : null;
    if (passwordProblem) {
      throw new Error(`BOOTSTRAP_PASSWORD must contain ${passwordProblem} — login enforces the same rule.`);
    }
    const passwordHash = await bcrypt.hash(password, 10);

    if (mine) {
      await mine.update({ passwordHash, roleId: superadminRole.id, status: "active", onboarded: true });
      console.log(`\n  Updated ${mine.companyEmail} (password reset, superadmin role reasserted).`);
    } else {
      await User.create({
        fullName: NAME,
        personalEmail: PERSONAL_EMAIL,
        companyEmail,
        passwordHash,
        roleId: superadminRole.id,
        organizationId: org.id,
        department: "Engineering",
        joiningDate: new Date(),
        status: "active",
        onboarded: true,
      } as never);
      console.log(`\n  Created ${companyEmail} as superadmin of ${org.name}.`);
    }

    console.log(`  Organization : ${org.name} (${org.slug}) — platform`);
    console.log(`  Email domain : ${org.emailDomain}  (tenants get <slug>.${org.emailDomain})`);
    console.log(`  Sign in with : ${companyEmail}  or  ${PERSONAL_EMAIL}`);
    if (!process.env.BOOTSTRAP_PASSWORD) {
      console.log(`  Password     : ${password}   <- shown once, change it after signing in`);
    }
    console.log();
  });

  await sequelize.close();
}

bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err.message);
  process.exit(1);
});
