import { FieldDefinition, Task, TaskActivity, User, WorkflowStatus } from "../models";
import type { TaskActivityType } from "../models/TaskActivity";

/**
 * Writes the task audit trail.
 *
 * Every entry stores a rendered summary. Reconstructing it at read time would
 * mean a renamed status or a deleted user silently rewrites what happened.
 *
 * Logging is best-effort: an audit write must never fail the user's actual edit,
 * so everything here swallows its errors and reports through the console.
 */
export async function logActivity(
  taskId: string,
  userId: string | null,
  type: TaskActivityType,
  summary: string,
  details?: Record<string, unknown>
) {
  try {
    await TaskActivity.create({ taskId, userId, type, summary, details: details ?? null });
  } catch (err: any) {
    console.error("[Activity] Failed to log:", err.message);
  }
}

const nameCache = new Map<string, string>();

async function statusName(id: string | null | undefined): Promise<string> {
  if (!id) return "none";
  if (nameCache.has(id)) return nameCache.get(id)!;
  const s = await WorkflowStatus.findByPk(id, { attributes: ["name"] });
  const name = s?.name ?? "unknown";
  nameCache.set(id, name);
  return name;
}

async function personName(id: string | null | undefined): Promise<string> {
  if (!id) return "nobody";
  if (nameCache.has(id)) return nameCache.get(id)!;
  const u = await User.findByPk(id, { attributes: ["fullName"] });
  const name = u?.fullName ?? "someone";
  nameCache.set(id, name);
  return name;
}

const asDate = (v: unknown) => (v ? String(v).slice(0, 10) : null);

/**
 * Diffs a task before/after an update and records one entry per real change.
 * Values that were submitted but unchanged produce nothing — an audit log full
 * of no-ops is worse than none.
 */
export async function logTaskDiff(
  before: Record<string, any>,
  after: Task,
  userId: string,
  customFieldNames?: Map<string, string>
) {
  const id = after.id;

  if (before.title !== after.title) {
    await logActivity(id, userId, "title_changed", `renamed this to "${after.title}"`, {
      from: before.title, to: after.title,
    });
  }

  if ((before.statusId ?? null) !== (after.statusId ?? null)) {
    const [from, to] = await Promise.all([statusName(before.statusId), statusName(after.statusId)]);
    await logActivity(id, userId, "status_changed", `changed status from ${from} to ${to}`, { from, to });
  }

  if ((before.assigneeId ?? null) !== (after.assigneeId ?? null)) {
    const to = await personName(after.assigneeId);
    await logActivity(id, userId, "assignee_changed", `assigned this to ${to}`, {
      from: before.assigneeId ?? null, to: after.assigneeId ?? null,
    });
  }

  const beforeStart = asDate(before.startDate);
  const afterStart = asDate(after.startDate);
  const beforeDue = asDate(before.dueDate);
  const afterDue = asDate(after.dueDate);
  if (beforeStart !== afterStart || beforeDue !== afterDue) {
    const label = afterStart && afterDue ? `${afterStart} → ${afterDue}` : afterDue ?? afterStart ?? "no dates";
    await logActivity(id, userId, "dates_changed", `set the dates to ${label}`, {
      startDate: afterStart, dueDate: afterDue,
    });
  }

  if (before.priority !== after.priority) {
    await logActivity(id, userId, "priority_changed", `set priority to ${after.priority}`, {
      from: before.priority, to: after.priority,
    });
  }

  if ((before.descriptionHtml ?? "") !== (after.descriptionHtml ?? "")) {
    await logActivity(id, userId, "description_changed", "updated the description");
  }

  if (Boolean(before.guestVisible) !== Boolean(after.guestVisible)) {
    await logActivity(
      id, userId, "shared_with_guests",
      after.guestVisible ? "shared this with collaborators" : "hid this from collaborators"
    );
  }

  // Custom fields: report by name, one entry per changed column.
  const prevFields = (before.customFields ?? {}) as Record<string, unknown>;
  const nextFields = (after.customFields ?? {}) as Record<string, unknown>;
  const changedKeys = [...new Set([...Object.keys(prevFields), ...Object.keys(nextFields)])]
    .filter((k) => JSON.stringify(prevFields[k]) !== JSON.stringify(nextFields[k]));

  if (changedKeys.length) {
    let names = customFieldNames;
    if (!names) {
      const defs = await FieldDefinition.findAll({ where: { id: changedKeys }, attributes: ["id", "name"], raw: true });
      names = new Map((defs as any[]).map((d) => [d.id, d.name]));
    }
    for (const key of changedKeys) {
      const label = names.get(key) ?? "a field";
      const value = nextFields[key];
      await logActivity(
        id, userId, "field_changed",
        value == null || value === "" ? `cleared ${label}` : `set ${label} to ${value}`,
        { field: label, value: value ?? null }
      );
    }
  }
}
