/** Shared shapes for the Work → Weekly Plan grid. */

export interface PlanTask {
  id: string;
  title: string;
  status: "Pending" | "In progress" | "Done";
  priority: "Low" | "Medium" | "High";
  dueDate: string | null;
  startDate: string | null;
  assigneeId: string | null;
  projectId: string | null;
  assignee: { id: string; fullName: string } | null;
  project: { id: string; name: string } | null;
}

export interface PlanPerson {
  id: string;
  fullName: string;
  companyEmail: string;
  department: string | null;
}

export const UNASSIGNED = "__unassigned__";

export function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `d`, at local midnight. */
export function mondayOf(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

export function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

/** Which column a task lands in: its due date if set, else its start date. */
export function taskDayKey(task: PlanTask): string | null {
  return task.dueDate || task.startDate || null;
}
