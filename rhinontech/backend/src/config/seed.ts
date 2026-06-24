import { sequelize } from "./database";
import { Role, Permission, User, CaseStudy, syncDatabase } from "../models";
import bcrypt from "bcryptjs";

const ALL_PERMISSIONS = [
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
];

async function seed() {
  await sequelize.authenticate();
  await syncDatabase();

  // Permissions
  const permissions = await Promise.all(
    ALL_PERMISSIONS.map((p) => Permission.findOrCreate({ where: { name: p.name }, defaults: p }))
  );
  const allPerms = permissions.map(([p]) => p);
  console.log("Permissions ready");

  // Superadmin role — all permissions
  const [superadminRole] = await Role.findOrCreate({
    where: { slug: "superadmin" },
    defaults: { name: "Super Admin", slug: "superadmin" },
  });
  await (superadminRole as any).setPermissions(allPerms);

  // HR role — team + payroll, no provisioning/settings
  const hrPerms = allPerms.filter((p) =>
    ["dashboard:read", "employees:read", "employees:write", "people:read",
     "payroll:read", "payroll:write", "payslips:read"].includes(p.name)
  );
  const [hrRole] = await Role.findOrCreate({
    where: { slug: "hr" },
    defaults: { name: "HR", slug: "hr" },
  });
  await (hrRole as any).setPermissions(hrPerms);

  // Employee role — own payslips + dashboard + read-only team directory
  const employeePerms = allPerms.filter((p) =>
    ["dashboard:read", "payslips:read", "people:read"].includes(p.name)
  );
  const [employeeRole] = await Role.findOrCreate({
    where: { slug: "employee" },
    defaults: { name: "Employee", slug: "employee" },
  });
  await (employeeRole as any).setPermissions(employeePerms);

  console.log("Roles ready: superadmin, hr, employee");

  // Prabhat Patra — the one superadmin
  const passwordHash = await bcrypt.hash("Admin@123", 10);
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
  console.log("Superadmin ready: prabhat@rhinontech.in / Admin@123");

  // Real, verified case study (start fresh — no fabricated clients/metrics).
  await CaseStudy.findOrCreate({
    where: { slug: "apexispro-architecture-operations" },
    defaults: {
      slug: "apexispro-architecture-operations",
      title: "ApexisPro — Architecture Operations",
      client: "ApexisPro",
      industry: "Architecture",
      category: "Operations Platform",
      timeline: "Custom build",
      date: "2024",
      description:
        "ApexisPro, an architecture practice, was juggling project tracking, client communication, document management, and approval workflows across fragmented tools. We built a single centralized operational platform that brought projects, documents, and approvals into one place — giving the team real visibility and far less manual coordination.",
      result: "Delivered a centralized operational platform (₹4,00,000 project).",
      quote:
        "One platform replaced fragmented project tracking, document management, and approval workflows — turning scattered operations into a single source of truth.",
      image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop",
      ],
      stats: [
        { value: "₹4L", suffix: "", label: "project value delivered" },
        { value: "4", suffix: "+", label: "workflows unified" },
      ],
      displayOrder: 1,
      status: "Published",
      createdById: prabhat.id,
    },
  });
  console.log("Seeded case study: ApexisPro");

  await sequelize.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
