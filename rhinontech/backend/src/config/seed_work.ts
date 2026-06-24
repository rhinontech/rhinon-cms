import { sequelize } from "./database";
import { Role, User, Project, Task, ClientRequest, Subtask, syncDatabase } from "../models";
import type { ProjectStatus } from "../models/Project";
import type { TaskStatus, TaskPriority } from "../models/Task";
import type { ClientRequestType, ClientRequestStatus, ClientRequestPriority } from "../models/ClientRequest";
import bcrypt from "bcryptjs";

// Beta/demo seed for the Work module — dummy projects, tasks and client
// requests only. No real client names. Idempotent: keyed on natural fields,
// so it can be re-run safely without creating duplicates.

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
};

const TEAM: { fullName: string; email: string; department: string }[] = [
  { fullName: "Alex Carter", email: "alex.carter@demo.test", department: "Engineering" },
  { fullName: "Jamie Lee", email: "jamie.lee@demo.test", department: "Design" },
  { fullName: "Morgan Diaz", email: "morgan.diaz@demo.test", department: "Engineering" },
  { fullName: "Priya Sharma", email: "priya.sharma@demo.test", department: "Quality" },
];

const PROJECTS: { name: string; status: ProjectStatus; pointOfContact: string; notes: string }[] = [
  { name: "Acme Retail Portal", status: "Active", pointOfContact: "Dana Wells", notes: "E-commerce storefront rebuild." },
  { name: "Globex Analytics Dashboard", status: "Active", pointOfContact: "Sam Okafor", notes: "Realtime KPI dashboards." },
  { name: "Initech Payments API", status: "Pipeline", pointOfContact: "Riley Quinn", notes: "New payments integration — scoping." },
  { name: "Umbrella Health Tracker", status: "Paused", pointOfContact: "Casey Tran", notes: "On hold pending client budget." },
  { name: "Northwind Logistics Suite", status: "Completed", pointOfContact: "Jordan Bell", notes: "Delivered and signed off." },
];

interface TaskSeed {
  project: string;
  title: string;
  description?: string;
  assignee: string;
  status: TaskStatus;
  priority: TaskPriority;
  due: string;
  hours: number;
  subtasks?: string[];
}

const TASKS: TaskSeed[] = [
  // Acme Retail Portal
  { project: "Acme Retail Portal", title: "Build product listing page", assignee: "Jamie Lee", status: "In progress", priority: "High", due: day(3), hours: 16, subtasks: ["Design grid layout", "Wire up products API", "Add pagination"] },
  { project: "Acme Retail Portal", title: "Integrate Stripe checkout", assignee: "Morgan Diaz", status: "Pending", priority: "High", due: day(7), hours: 12 },
  { project: "Acme Retail Portal", title: "Fix cart total rounding bug", assignee: "Alex Carter", status: "Done", priority: "Medium", due: day(-2), hours: 4 },
  { project: "Acme Retail Portal", title: "Optimize product image loading", assignee: "Jamie Lee", status: "Pending", priority: "Low", due: day(12), hours: 4 },
  // Globex Analytics Dashboard
  { project: "Globex Analytics Dashboard", title: "Design KPI overview screen", assignee: "Jamie Lee", status: "In progress", priority: "Medium", due: day(5), hours: 10, subtasks: ["Define KPI cards", "Choose chart library", "Review with client"] },
  { project: "Globex Analytics Dashboard", title: "Implement CSV export", assignee: "Morgan Diaz", status: "Pending", priority: "Low", due: day(10), hours: 6 },
  { project: "Globex Analytics Dashboard", title: "Set up nightly data refresh cron", assignee: "Alex Carter", status: "Pending", priority: "Medium", due: day(6), hours: 5 },
  { project: "Globex Analytics Dashboard", title: "Write E2E tests for filters", assignee: "Priya Sharma", status: "In progress", priority: "Medium", due: day(8), hours: 9 },
  // Initech Payments API
  { project: "Initech Payments API", title: "Draft API contract", assignee: "Alex Carter", status: "In progress", priority: "High", due: day(4), hours: 8 },
  { project: "Initech Payments API", title: "Define OAuth2 auth flow", assignee: "Morgan Diaz", status: "Pending", priority: "High", due: day(9), hours: 10 },
  // Umbrella Health Tracker
  { project: "Umbrella Health Tracker", title: "Audit accessibility issues", assignee: "Priya Sharma", status: "Pending", priority: "Medium", due: day(14), hours: 8 },
  { project: "Umbrella Health Tracker", title: "Migrate to new charting library", assignee: "Morgan Diaz", status: "Pending", priority: "Low", due: day(21), hours: 12 },
  // Northwind Logistics Suite
  { project: "Northwind Logistics Suite", title: "Final QA regression pass", assignee: "Priya Sharma", status: "Done", priority: "High", due: day(-10), hours: 16, subtasks: ["Smoke test core flows", "Verify reports", "Sign-off"] },
  { project: "Northwind Logistics Suite", title: "Write handover documentation", assignee: "Alex Carter", status: "Done", priority: "Medium", due: day(-7), hours: 6 },
];

interface RequestSeed {
  project: string;
  title: string;
  description: string;
  type: ClientRequestType;
  status: ClientRequestStatus;
  priority: ClientRequestPriority;
  reportedBy: string;
}

const REQUESTS: RequestSeed[] = [
  { project: "Acme Retail Portal", title: "Checkout page slow on mobile", description: "Checkout takes 6+ seconds to load on mobile devices.", type: "Bug", status: "Open", priority: "High", reportedBy: "Dana Wells" },
  { project: "Acme Retail Portal", title: "Add gift wrapping option", description: "Allow customers to add gift wrapping at checkout.", type: "Change request", status: "In progress", priority: "Medium", reportedBy: "Dana Wells" },
  { project: "Globex Analytics Dashboard", title: "Export missing timezone column", description: "CSV export omits the timezone column present in the UI.", type: "Bug", status: "Open", priority: "Medium", reportedBy: "Sam Okafor" },
  { project: "Globex Analytics Dashboard", title: "Add dark mode", description: "Request to add a dark theme toggle to the dashboard.", type: "Change request", status: "In review", priority: "Low", reportedBy: "Sam Okafor" },
  { project: "Umbrella Health Tracker", title: "Login fails on Safari", description: "Users on Safari 17 cannot log in — session cookie not set.", type: "Bug", status: "Open", priority: "High", reportedBy: "Casey Tran" },
  { project: "Northwind Logistics Suite", title: "Report header formatting glitch", description: "PDF report header overlaps the logo on the first page.", type: "Bug", status: "Done", priority: "Low", reportedBy: "Jordan Bell" },
];

async function seedWork() {
  await sequelize.authenticate();
  await syncDatabase();

  // Employee role for the demo team members
  const [employeeRole] = await Role.findOrCreate({
    where: { slug: "employee" },
    defaults: { name: "Employee", slug: "employee" },
  });

  const passwordHash = await bcrypt.hash("Password@123", 10);

  // --- Demo team members (assignees) ---
  const users: Record<string, User> = {};
  for (const m of TEAM) {
    const [user] = await User.findOrCreate({
      where: { personalEmail: m.email },
      defaults: {
        fullName: m.fullName,
        personalEmail: m.email,
        companyEmail: m.email,
        passwordHash,
        roleId: employeeRole.id,
        department: m.department,
        joiningDate: new Date("2025-09-01"),
        status: "active",
        onboarded: true,
      },
    });
    users[m.fullName] = user;
  }
  const creatorId = users["Alex Carter"].id;
  console.log(`Team members ready: ${TEAM.map((t) => t.fullName).join(", ")}`);

  // --- Projects ---
  const projects: Record<string, Project> = {};
  for (const p of PROJECTS) {
    const [project] = await Project.findOrCreate({
      where: { name: p.name },
      defaults: {
        name: p.name,
        status: p.status,
        pointOfContact: p.pointOfContact,
        notes: p.notes,
        createdById: creatorId,
      },
    });
    projects[p.name] = project;
  }
  console.log(`Projects ready: ${PROJECTS.length}`);

  // --- Tasks (+ subtasks) ---
  for (const t of TASKS) {
    const projectId = projects[t.project].id;
    const [task, created] = await Task.findOrCreate({
      where: { title: t.title, projectId },
      defaults: {
        title: t.title,
        description: t.description,
        projectId,
        assigneeId: users[t.assignee].id,
        createdById: creatorId,
        status: t.status,
        priority: t.priority,
        dueDate: new Date(t.due),
        estimatedHours: t.hours,
      },
    });

    if (created && t.subtasks) {
      const taskDone = t.status === "Done";
      await Promise.all(
        t.subtasks.map((title, index) =>
          Subtask.findOrCreate({
            where: { taskId: task.id, title },
            defaults: { taskId: task.id, title, order: index, done: taskDone },
          })
        )
      );
    }
  }
  console.log(`Tasks ready: ${TASKS.length}`);

  // --- Client requests ---
  for (const r of REQUESTS) {
    await ClientRequest.findOrCreate({
      where: { title: r.title },
      defaults: {
        title: r.title,
        description: r.description,
        type: r.type,
        status: r.status,
        priority: r.priority,
        projectId: projects[r.project].id,
        reportedBy: r.reportedBy,
        createdById: creatorId,
      },
    });
  }
  console.log(`Client requests ready: ${REQUESTS.length}`);

  await sequelize.close();
  console.log("Work seed complete.");
}

seedWork().catch((err) => {
  console.error("Work seed failed:", err);
  process.exit(1);
});
