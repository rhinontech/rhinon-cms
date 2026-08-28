import { sequelize } from "./database";
import { Task, WorkflowStatus } from "../models";
import type { StatusGroup } from "../models/WorkflowStatus";

/**
 * The company-wide default workflow (projectId null), matching the set a
 * project management tool ships with out of the box, plus the backfill that
 * points every existing task at the right one.
 *
 * Idempotent: re-running only fills gaps.
 */
export const DEFAULT_STATUSES: {
  name: string;
  color: string;
  group: StatusGroup;
  order: number;
  isDefault?: boolean;
}[] = [
  { name: "New",         color: "blue",   group: "New",       order: 0, isDefault: true },
  { name: "Planned",     color: "indigo", group: "New",       order: 1 },
  { name: "In progress", color: "cyan",   group: "Active",    order: 2 },
  { name: "In review",   color: "amber",  group: "Active",    order: 3 },
  { name: "Completed",   color: "green",  group: "Completed", order: 4 },
  { name: "Cancelled",   color: "stone",  group: "Cancelled", order: 5 },
];

/** Legacy 3-value enum -> the default status a task should land on. */
const LEGACY_MAP: Record<string, string> = {
  Pending: "New",
  "In progress": "In progress",
  Done: "Completed",
};

export async function seedDefaultWorkflow() {
  const created: string[] = [];
  for (const def of DEFAULT_STATUSES) {
    const [, isNew] = await WorkflowStatus.findOrCreate({
      where: { projectId: null, name: def.name },
      defaults: { ...def, projectId: null, isDefault: def.isDefault ?? false },
    });
    if (isNew) created.push(def.name);
  }

  const defaults = await WorkflowStatus.findAll({ where: { projectId: null } });
  const byName = new Map(defaults.map((s) => [s.name, s.id]));

  // Backfill: only tasks that have no custom status yet, so a project that has
  // since customised its workflow is never clobbered.
  let backfilled = 0;
  for (const [legacy, statusName] of Object.entries(LEGACY_MAP)) {
    const statusId = byName.get(statusName);
    if (!statusId) continue;
    const [count] = await Task.update(
      { statusId },
      { where: { statusId: null as any, status: legacy as any } }
    );
    backfilled += count;
  }

  return { created, backfilled };
}

if (require.main === module) {
  (async () => {
    await sequelize.authenticate();
    const { created, backfilled } = await seedDefaultWorkflow();
    console.log(`[Workflow] statuses created: ${created.length ? created.join(", ") : "none (already present)"}`);
    console.log(`[Workflow] tasks backfilled onto a status: ${backfilled}`);
    await sequelize.close();
  })().catch((err) => {
    console.error("[Workflow] Seed failed:", err.message);
    process.exit(1);
  });
}
