import type { TaskFormState, TaskPriority, TaskStatus } from "./types";

export const STATUSES: TaskStatus[] = ["Pending", "In progress", "Done"];
export const PRIORITIES: TaskPriority[] = ["Low", "Medium", "High"];

/** Synthetic section keys. Prefixed so they can never collide with a UUID. */
export const UNASSIGNED_KEY = "__unassigned";
export const NO_PROJECT_KEY = "__internal";

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  Low: "bg-stone-100 text-stone-600 border-stone-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High: "bg-red-50 text-red-700 border-red-200",
};

export const STATUS_STYLES: Record<TaskStatus, string> = {
  Pending: "bg-stone-100 text-stone-700 border-stone-200",
  "In progress": "bg-blue-50 text-blue-700 border-blue-200",
  Done: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const TAG_COLORS = ["gray", "red", "amber", "green", "blue", "indigo", "purple", "pink"] as const;

export const TAG_COLOR_HEX: Record<string, string> = {
  gray: "#78716c", red: "#dc2626", amber: "#d97706", green: "#059669",
  blue: "#2563eb", indigo: "#4f46e5", purple: "#9333ea", pink: "#db2777",
};

export const TAG_COLOR_STYLES: Record<string, string> = {
  gray: "bg-stone-100 text-stone-700 border-stone-200",
  red: "bg-red-50 text-red-700 border-red-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  pink: "bg-pink-50 text-pink-700 border-pink-200",
};

/**
 * v2 keys. The v1 keys held PLAIN STRINGS (`work_viewMode` = `list`, not `"list"`),
 * so JSON.parse'ing them throws on every mount. Nothing here reuses a v1 name;
 * the old ones are deleted once, on first load.
 */
export const LS = {
  scope: "work_tasks_v2:scope",
  view: "work_tasks_v2:view",
  group: "work_tasks_v2:group",
  filters: "work_tasks_v2:filters",
  sections: "work_tasks_v2:sections",
  migrated: "work_tasks_v2:migrated",
} as const;

export const LEGACY_LS_KEYS = [
  "work_projectFilter", "work_statusFilter", "work_assigneeFilter",
  "work_priorityFilter", "work_tagFilter", "work_viewMode",
  "work_wipLimits", "work_savedFilters",
];

/** One template shared by the list header and every list row, so they stay aligned. */
export const LIST_GRID = "grid-cols-[36px_minmax(220px,1.6fr)_minmax(120px,0.8fr)_110px_130px_110px_36px]";

export const emptyForm = (): TaskFormState => ({
  title: "", description: "", dueDate: "", status: "Pending", priority: "Medium",
  projectId: "", assigneeId: "", estimatedHours: "", recurrence: "", blockedById: "",
});
