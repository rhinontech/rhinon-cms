import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * The legacy coarse status. Kept as the rollup of a custom status's group so
 * that existing filters, the CRM request sync and the recurrence logic all keep
 * working while `statusId` carries the project's own vocabulary.
 */
export type TaskStatus = "Pending" | "In progress" | "Done";
export type TaskPriority = "Low" | "Medium" | "High";
export type TaskRecurrence = "Daily" | "Weekly" | "Monthly";

interface TaskAttributes {
  id: string;
  title: string;
  description?: string;
  assigneeId?: string;
  createdById: string;
  projectId?: string;
  team?: string;
  // Opt-in, not opt-out: adding a collaborator to an existing project must not
  // retroactively expose its history. Share tasks deliberately.
  guestVisible?: boolean;
  // --- Wrike-parity fields ---
  // Gantt and Calendar both render a RANGE. Without a start date neither view
  // can exist, which is why this lands in the foundation phase.
  startDate?: Date | null;
  /** Rich-text body (TipTap HTML). `description` stays as the plain-text fallback. */
  descriptionHtml?: string | null;
  /** Custom status; `status` below is kept as the coarse rollup of its group. */
  statusId?: string | null;
  /** Real subitems — a child Task with its own assignee, dates and status. */
  parentTaskId?: string | null;
  /** Manual ordering within a list/board column. */
  position?: number;
  completedAt?: Date | null;
  /** Values for FieldDefinition columns, keyed by definition id. */
  customFields?: Record<string, unknown>;
  dueDate?: Date;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedHours?: number | null;
  recurrence?: TaskRecurrence | null;
  blockedById?: string | null;
  // CRM linkage: lets a follow-up hang off a lead / deal / account.
  leadId?: string | null;
  dealId?: string | null;
  accountId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskCreationAttributes
  extends Optional<TaskAttributes, "id" | "description" | "assigneeId" | "projectId" | "team" | "guestVisible" | "startDate" | "descriptionHtml" | "statusId" | "parentTaskId" | "position" | "completedAt" | "customFields" | "dueDate" | "status" | "priority" | "estimatedHours" | "recurrence" | "blockedById" | "leadId" | "dealId" | "accountId"> {}

export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  declare id: string;
  declare title: string;
  declare description?: string;
  declare assigneeId?: string;
  declare createdById: string;
  declare projectId?: string;
  declare team?: string;
  declare guestVisible: boolean;
  declare startDate: Date | null;
  declare descriptionHtml: string | null;
  declare statusId: string | null;
  declare parentTaskId: string | null;
  declare position: number;
  declare completedAt: Date | null;
  declare customFields: Record<string, unknown>;
  declare dueDate?: Date;
  declare status: TaskStatus;
  declare priority: TaskPriority;
  declare estimatedHours: number | null;
  declare recurrence: TaskRecurrence | null;
  declare blockedById: string | null;
  declare leadId: string | null;
  declare dealId: string | null;
  declare accountId: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Task.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    assigneeId: { type: DataTypes.UUID, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: false },
    projectId: { type: DataTypes.UUID, allowNull: true },
    team: { type: DataTypes.STRING, allowNull: true },
    guestVisible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    descriptionHtml: { type: DataTypes.TEXT, allowNull: true },
    statusId: { type: DataTypes.UUID, allowNull: true },
    parentTaskId: { type: DataTypes.UUID, allowNull: true },
    position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    customFields: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.ENUM("Pending", "In progress", "Done"), defaultValue: "Pending" },
    priority: { type: DataTypes.ENUM("Low", "Medium", "High"), defaultValue: "Medium", allowNull: false },
    estimatedHours: { type: DataTypes.FLOAT, allowNull: true },
    recurrence: { type: DataTypes.ENUM("Daily", "Weekly", "Monthly"), allowNull: true },
    blockedById: { type: DataTypes.UUID, allowNull: true },
    leadId: { type: DataTypes.UUID, allowNull: true },
    dealId: { type: DataTypes.UUID, allowNull: true },
    accountId: { type: DataTypes.UUID, allowNull: true },
  },
  { sequelize, tableName: "tasks", timestamps: true }
);
