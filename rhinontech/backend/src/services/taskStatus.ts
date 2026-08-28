import { WorkflowStatus } from "../models";
import type { TaskStatus } from "../models/Task";

/**
 * Keeps the legacy three-value Task.status in step with a custom status.
 *
 * Existing behaviour depends on that enum in several places — the ClientRequest
 * sync, recurrence spawning, the kanban's three columns, dashboard counts — so
 * rather than rip it out, it is derived from the custom status's group. Custom
 * vocabulary on top, stable rollup underneath.
 */
const GROUP_TO_LEGACY: Record<string, TaskStatus> = {
  New: "Pending",
  Active: "In progress",
  Completed: "Done",
  // No legacy equivalent; treated as closed so it leaves the active board.
  Cancelled: "Done",
};

export async function legacyStatusFor(statusId: string | null | undefined): Promise<TaskStatus | null> {
  if (!statusId) return null;
  const status = await WorkflowStatus.findByPk(statusId, { attributes: ["group"] });
  if (!status) return null;
  return GROUP_TO_LEGACY[status.group] ?? "Pending";
}

/** The status a new task in this project should start in. */
export async function defaultStatusFor(projectId: string | null | undefined): Promise<WorkflowStatus | null> {
  if (projectId) {
    const own = await WorkflowStatus.findOne({
      where: { projectId, isDefault: true },
      order: [["order", "ASC"]],
    });
    if (own) return own;
    // A project with a custom workflow but no explicit default: take its first column.
    const first = await WorkflowStatus.findOne({ where: { projectId }, order: [["order", "ASC"]] });
    if (first) return first;
  }
  return WorkflowStatus.findOne({
    where: { projectId: null, isDefault: true },
    order: [["order", "ASC"]],
  });
}

/** The ordered columns a project's Board should render. */
export async function workflowFor(projectId: string | null | undefined): Promise<WorkflowStatus[]> {
  if (projectId) {
    const own = await WorkflowStatus.findAll({ where: { projectId }, order: [["order", "ASC"]] });
    if (own.length) return own;
  }
  return WorkflowStatus.findAll({ where: { projectId: null }, order: [["order", "ASC"]] });
}
