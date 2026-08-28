import bcrypt from "bcryptjs";
import { sequelize } from "./database";
import {
  FieldDefinition, Project, Role, Task, TaskActivity, TaskComment, TaskDependency, TimeEntry, User, WorkflowStatus,
} from "../models";
import { seedDefaultWorkflow } from "./seedWorkflow";

/**
 * A fully-populated demo project, so every tab has something real to render.
 *
 * Strictly ADDITIVE and idempotent — it only ever findOrCreates, and never
 * touches roles, permissions or any existing record. (See the note on db:seed:
 * a seed that "sets" rather than "adds" has burned this project before.)
 *
 * Run with --clean to remove everything it created and nothing else.
 */

const PROJECT_NAME = "Demo Project 🚀";
const DEMO_EMAIL = "demo.employee@rhinon.tech";

/** Dates are relative to today so the Gantt and Calendar always look current. */
function day(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

async function findDemoUser() {
  return User.findOne({ where: { companyEmail: DEMO_EMAIL } });
}

async function clean() {
  const project = await Project.findOne({ where: { name: PROJECT_NAME } });
  if (project) {
    const tasks = await Task.findAll({ where: { projectId: project.id }, attributes: ["id"], raw: true }) as unknown as { id: string }[];
    const ids = tasks.map((t) => t.id);
    if (ids.length) {
      await TaskDependency.destroy({ where: { successorId: ids } });
      await TaskDependency.destroy({ where: { predecessorId: ids } });
      await TaskComment.destroy({ where: { taskId: ids } });
      await TaskActivity.destroy({ where: { taskId: ids } });
      await TimeEntry.destroy({ where: { taskId: ids } });
      // Children first, so a parent never disappears out from under one.
      await Task.destroy({ where: { parentTaskId: ids } });
      await Task.destroy({ where: { projectId: project.id } });
    }
    await FieldDefinition.destroy({ where: { projectId: project.id } });
    await WorkflowStatus.destroy({ where: { projectId: project.id } });
    await project.destroy();
    console.log(`[Demo] Removed project "${PROJECT_NAME}" and its ${ids.length} task(s).`);
  } else {
    console.log("[Demo] No demo project found — nothing to remove.");
  }

  const demo = await findDemoUser();
  if (demo) {
    await demo.destroy();
    console.log("[Demo] Removed the demo employee.");
  }
}

async function seed() {
  // The default workflow must exist before tasks can be placed in a column.
  await seedDefaultWorkflow();
  const statuses = await WorkflowStatus.findAll({ where: { projectId: null }, order: [["order", "ASC"]] });
  const status = (name: string) => statuses.find((s) => s.name === name)?.id ?? null;

  const role = await Role.findOne({ where: { slug: "employee" } })
    ?? await Role.findOne({ where: { slug: "superadmin" } });
  if (!role) throw new Error("No role found — run db:seed first.");

  const [demo] = await User.findOrCreate({
    where: { companyEmail: DEMO_EMAIL },
    defaults: {
      fullName: "Demo Employee",
      personalEmail: DEMO_EMAIL,
      companyEmail: DEMO_EMAIL,
      passwordHash: await bcrypt.hash("demo-not-a-real-login", 10),
      roleId: role.id,
      department: "Demo",
      joiningDate: new Date(),
      status: "active",
      onboarded: true,
    } as any,
  });

  const [project] = await Project.findOrCreate({
    where: { name: PROJECT_NAME },
    defaults: {
      name: PROJECT_NAME,
      status: "Active",
      pointOfContact: "Demo Employee",
      notes: "Seeded sample project — safe to delete with `npm run db:seed:demo -- --clean`.",
      createdById: demo.id,
      ownerId: demo.id,
      visibility: "workspace",
    } as any,
  });

  // --- custom columns (the Budget / Impact columns from the reference UI) ---
  const [budget] = await FieldDefinition.findOrCreate({
    where: { projectId: project.id, name: "Budget" },
    defaults: { projectId: project.id, name: "Budget", type: "currency", order: 0, createdById: demo.id } as any,
  });
  const [impact] = await FieldDefinition.findOrCreate({
    where: { projectId: project.id, name: "Impact" },
    defaults: {
      projectId: project.id, name: "Impact", type: "dropdown",
      options: ["Low", "Medium", "High"], order: 1, createdById: demo.id,
    } as any,
  });

  const mk = async (spec: {
    title: string; statusName: string; start: number; due: number;
    budget: number; impact: string; parentId?: string; position: number;
    priority?: "Low" | "Medium" | "High";
  }) => {
    const [task] = await Task.findOrCreate({
      where: { projectId: project.id, title: spec.title },
      defaults: {
        title: spec.title,
        projectId: project.id,
        createdById: demo.id,
        assigneeId: demo.id,
        parentTaskId: spec.parentId ?? null,
        statusId: status(spec.statusName),
        status: spec.statusName === "Completed" ? "Done" : spec.statusName === "New" ? "Pending" : "In progress",
        priority: spec.priority ?? "Medium",
        startDate: day(spec.start),
        dueDate: day(spec.due),
        position: spec.position,
        guestVisible: true,
        customFields: { [budget.id]: spec.budget, [impact.id]: spec.impact },
        descriptionHtml:
          `<p>Add a description for the task here.</p><ul><li>Use <strong>formatting tools</strong> like <em>emphasis</em> and lists</li><li>Attach files from the Files tab</li></ul>`,
      } as any,
    });
    return task;
  };

  const first = await mk({ title: "First task", statusName: "In review", start: -7, due: -1, budget: 5000, impact: "Low", position: 0, priority: "Low" });
  await mk({ title: "Subitem", statusName: "Completed", start: -7, due: -7, budget: 500, impact: "Low", parentId: first.id, position: 0 });
  const sub2 = await mk({ title: "Another subitem", statusName: "Completed", start: -5, due: -4, budget: 500, impact: "Low", parentId: first.id, position: 1 });
  const second = await mk({ title: "Second task", statusName: "New", start: 0, due: 4, budget: 1000, impact: "Medium", position: 1 });
  const third = await mk({ title: "Third task", statusName: "New", start: 5, due: 7, budget: 2000, impact: "High", position: 2, priority: "High" });

  // --- a dependency chain, so the Gantt has arrows to draw ---
  for (const [predecessor, successor] of [[sub2, first], [first, second], [second, third]] as const) {
    await TaskDependency.findOrCreate({
      where: { predecessorId: predecessor.id, successorId: successor.id },
      defaults: { predecessorId: predecessor.id, successorId: successor.id, type: "FS", lagDays: 0 } as any,
    });
  }

  // --- comments, including a mention in the stored @[Name](id) form ---
  const comments = [
    { taskId: first.id, body: `@[Demo Employee](${demo.id}) here's an example task you might find helpful.` },
    { taskId: first.id, body: "Set the approval due date and started review." },
    { taskId: second.id, body: "Due date is approaching — please give an update or change the dates." },
  ];
  for (const c of comments) {
    const exists = await TaskComment.findOne({ where: { taskId: c.taskId, body: c.body } });
    if (!exists) await TaskComment.create({ ...c, userId: demo.id });
  }

  // --- logged time, so the Analytics progress tile has substance ---
  for (const [taskId, minutes, offset] of [[first.id, 95, -3], [sub2.id, 40, -5], [second.id, 25, -1]] as const) {
    const exists = await TimeEntry.findOne({ where: { taskId, minutes } });
    if (!exists) await TimeEntry.create({ taskId, userId: demo.id, minutes, spentOn: new Date(day(offset)), note: "Seeded" });
  }

  // --- activity trail, so the drawer opens on a populated timeline ---
  const trail: { taskId: string; type: any; summary: string }[] = [
    { taskId: first.id, type: "created", summary: "created this task" },
    { taskId: first.id, type: "dates_changed", summary: `set the dates to ${day(-7)} → ${day(-1)}` },
    { taskId: first.id, type: "assignee_changed", summary: "assigned this to Demo Employee" },
    { taskId: first.id, type: "status_changed", summary: "changed status from New to In review" },
    { taskId: first.id, type: "dependency_added", summary: 'made this wait on "Another subitem"' },
    { taskId: first.id, type: "time_logged", summary: "logged 95 min" },
    { taskId: second.id, type: "created", summary: "created this task" },
    { taskId: second.id, type: "field_changed", summary: "set Impact to Medium" },
    { taskId: third.id, type: "created", summary: "created this task" },
    { taskId: third.id, type: "priority_changed", summary: "set priority to High" },
  ];
  for (const entry of trail) {
    const exists = await TaskActivity.findOne({ where: { taskId: entry.taskId, summary: entry.summary } });
    if (!exists) await TaskActivity.create({ ...entry, userId: demo.id, details: null });
  }

  console.log(`[Demo] Project "${project.name}" ready — 5 tasks, 2 custom columns, 3 dependencies, 3 comments, 3 time entries, 10 activity entries.`);
  console.log("[Demo] Files tab will be empty: attachments need a real upload through the UI.");
}

(async () => {
  const args = process.argv.slice(2);
  const url = process.env.DATABASE_URL || "";
  const dbName = url.split("/").pop()?.split("?")[0] ?? "unknown";
  const host = url.split("@")[1]?.split("/")[0] ?? "unknown";

  console.log(`\n  Target database: ${dbName}  (host: ${host})`);

  if (!args.includes("--confirm")) {
    console.log("\n  Refusing to write without --confirm.");
    console.log("  This repo's default .env points at PRODUCTION, so the target is stated above on purpose.");
    console.log("  Seed:  npm run db:seed:demo -- --confirm");
    console.log("  Undo:  npm run db:seed:demo -- --confirm --clean\n");
    process.exit(1);
  }

  await sequelize.authenticate();
  if (args.includes("--clean")) await clean();
  else await seed();
  await sequelize.close();
})().catch((err) => {
  console.error("[Demo] Failed:", err.message);
  process.exit(1);
});
