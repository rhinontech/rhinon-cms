/** Shared shapes for the Work → Tasks board. */

export type TaskScope = "my" | "team" | "all";
export type TaskStatus = "Pending" | "In progress" | "Done";
export type TaskPriority = "Low" | "Medium" | "High";
export type TaskRecurrence = "Daily" | "Weekly" | "Monthly";
export type GroupMode = "person" | "project";
export type ViewMode = "list" | "kanban";
export type PanelMode = "view" | "create" | "edit";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  order: number;
}

export interface TaskTagItem {
  id: string;
  label: string;
  color: string;
}

export interface TaskComment {
  id: string;
  body: string;
  userId: string;
  createdAt: string;
  author: { id: string; fullName: string } | null;
}

export interface ApiTask {
  id: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  createdById: string;
  // `projectId` is returned by the API but was missing from the old interface,
  // which is why grouping code has to fall back to `project?.id`.
  projectId: string | null;
  /** Whether external collaborators on the project can see this task. */
  guestVisible?: boolean;
  dueDate: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedHours: number | null;
  recurrence: TaskRecurrence | null;
  blockedById: string | null;
  assignee: { id: string; fullName: string; companyEmail: string } | null;
  creator: { id: string; fullName: string } | null;
  project: { id: string; name: string; status: string; visibility?: "workspace" | "team" | "private"; teamId?: string | null } | null;
  blocker: { id: string; title: string; status: TaskStatus } | null;
  subtasks: Subtask[];
  tags: TaskTagItem[];
}

export interface ProjectOption {
  id: string;
  name: string;
  status?: string;
}

export interface TeamOption {
  id: string;
  name: string;
}

export interface PersonOption {
  id: string;
  fullName: string;
  companyEmail: string;
  department: string | null;
}

/** The subset of a task a drag or an inline control can change in one PUT. */
export interface TaskPatch {
  status?: TaskStatus;
  assigneeId?: string | null;
  projectId?: string | null;
  priority?: TaskPriority;
}

export type SectionKind =
  | "person"
  | "project"
  | "unassigned"
  | "no-project"
  | "inactive-person";

export interface TaskSection {
  /** userId | projectId | UNASSIGNED_KEY | NO_PROJECT_KEY */
  key: string;
  kind: SectionKind;
  label: string;
  sublabel?: string;
  isMe: boolean;
  tasks: ApiTask[];
  counts: {
    total: number;
    pending: number;
    inProgress: number;
    done: number;
    overdue: number;
  };
}

/** Payload carried on dnd-kit droppables. `status: null` = "keep the status". */
export interface DropData {
  groupKey: string;
  status: TaskStatus | null;
}

export interface TaskFormState {
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId: string;
  estimatedHours: string;
  recurrence: string;
  blockedById: string;
}
