export type StatusGroup = "New" | "Active" | "Completed" | "Cancelled";

export interface WorkflowStatus {
  id: string;
  projectId: string | null;
  name: string;
  color: string;
  group: StatusGroup;
  order: number;
  isDefault: boolean;
}

export type FieldType =
  | "text" | "number" | "currency" | "percent" | "date" | "checkbox" | "dropdown" | "user";

export interface FieldDefinition {
  id: string;
  projectId: string | null;
  name: string;
  type: FieldType;
  options: string[] | null;
  order: number;
}

export interface PersonOption {
  id: string;
  fullName: string;
  companyEmail?: string;
}

export type DependencyType = "FS" | "SS" | "FF" | "SF";

export interface TaskDependency {
  id: string;
  predecessorId: string;
  type: DependencyType;
  lagDays: number;
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string | null;
  /** TipTap HTML; `description` remains the plain-text fallback. */
  descriptionHtml: string | null;
  status: "Pending" | "In progress" | "Done";
  statusId: string | null;
  priority: "Low" | "Medium" | "High";
  startDate: string | null;
  dueDate: string | null;
  projectId: string | null;
  parentTaskId: string | null;
  position: number;
  assigneeId: string | null;
  guestVisible?: boolean;
  customFields: Record<string, unknown>;
  assignee?: { id: string; fullName: string } | null;
  workflowStatus?: WorkflowStatus | null;
  attachments?: { id: string; name: string; mimeType: string }[];
  /** Edges where THIS task is the successor — i.e. what it waits on. */
  dependsOn?: TaskDependency[];
  tags?: { id: string; label: string; color: string }[];
}

/** A task plus its depth in the parent/child tree, flattened for row rendering. */
export interface TaskRow {
  task: ProjectTask;
  depth: number;
  hasChildren: boolean;
}

export interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  visibility?: "workspace" | "team" | "private";
  team?: { id: string; name: string } | null;
}
