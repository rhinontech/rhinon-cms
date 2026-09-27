import { QueryTypes } from "sequelize";
import { sequelize } from "./database";
import { Role, Permission, User, syncDatabase } from "../models";
import { PERMISSION_CATALOG, DEFAULT_ROLE_GRANTS } from "./permissions";
import bcrypt from "bcryptjs";

async function seed() {
  await sequelize.authenticate();

  // This script predates multi-tenancy: it looks roles up by bare slug and
  // creates the superadmin with no organization, so on a tenanted database it
  // produces rows that belong to nobody — and `setPermissions` would replace
  // the grants of whichever org's role it happened to match first.
  const [tenanted] = await sequelize.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'organizations'`,
    { type: QueryTypes.SELECT }
  );
  if (Number(tenanted?.count ?? 0) > 0) {
    console.error(
      "Refusing to run: this database is multi-tenant.\n" +
        "  - platform superadmin -> npm run db:bootstrap\n" +
        "  - a new workspace     -> POST /auth/signup\n" +
        "  - role permissions    -> provisionOrganizationDefaults(), which runs at boot"
    );
    process.exit(1);
  }

  await syncDatabase();

  // Permissions
  const permissions = await Promise.all(
    PERMISSION_CATALOG.map((p) => Permission.findOrCreate({ where: { name: p.name }, defaults: p }))
  );
  const allPerms = permissions.map(([p]) => p);
  console.log("Permissions ready");

  // Superadmin role — all permissions
  const [superadminRole] = await Role.findOrCreate({
    where: { slug: "superadmin" },
    defaults: { name: "Super Admin", slug: "superadmin" },
  });
  await (superadminRole as any).setPermissions(allPerms);

  // HR role — team + payroll, no provisioning/settings. Base list merged with
  // DEFAULT_ROLE_GRANTS from config/permissions.ts (the single source of truth
  // also used by the boot-time catalog sync) so this can never again drift out
  // of sync with what the app actually defaults new roles to.
  const hrPerms = allPerms.filter((p) =>
    ["dashboard:read", "employees:read", "employees:write", "people:read",
     "payroll:read", "payroll:write", "payslips:read", ...DEFAULT_ROLE_GRANTS.hr].includes(p.name)
  );
  const [hrRole] = await Role.findOrCreate({
    where: { slug: "hr" },
    defaults: { name: "HR", slug: "hr" },
  });
  await (hrRole as any).setPermissions(hrPerms);

  // Employee role — own payslips + dashboard + read-only team directory
  const employeePerms = allPerms.filter((p) =>
    ["dashboard:read", "payslips:read", "people:read", ...DEFAULT_ROLE_GRANTS.employee].includes(p.name)
  );
  const [employeeRole] = await Role.findOrCreate({
    where: { slug: "employee" },
    defaults: { name: "Employee", slug: "employee" },
  });
  await (employeeRole as any).setPermissions(employeePerms);

  console.log("Roles ready: superadmin, hr, employee");

  // Prabhat Patra — the one superadmin
  const passwordHash = await bcrypt.hash("1q2w3e4r", 10);
  const [prabhat] = await User.findOrCreate({
    where: { companyEmail: "prabhat@rhinontech.in" },
    defaults: {
      fullName: "Prabhat Patra",
      personalEmail: "prabhatpatra24@gmail.com",
      companyEmail: "prabhat@rhinontech.in",
      passwordHash,
      roleId: superadminRole.id,
      department: "Engineering",
      joiningDate: new Date("2024-05-06"),
      status: "active",
      onboarded: true,
    },
  });
  await prabhat.update({
    fullName: "Prabhat Patra",
    personalEmail: "prabhatpatra24@gmail.com",
    passwordHash,
    roleId: superadminRole.id,
    department: "Engineering",
    joiningDate: new Date("2024-05-06"),
    employmentType: "Full-Time",
    compensationType: "Salaried",
    workSchedule: "11 AM – 8 PM (Mon–Sat)",
    workLocation: "Bengaluru",
    paymentFrequency: "Monthly",
    pfEnabled: false,
    ptAmount: 0,
    tdsAmount: 0,
    onboarded: true,
  });
  console.log("Superadmin ready: prabhat@rhinontech.in / 1q2w3e4r");

  await sequelize.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
