import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type TaskActivityType =
  | "created"
  | "title_changed"
  | "status_changed"
  | "assignee_changed"
  | "dates_changed"
  | "priority_changed"
  | "description_changed"
  | "field_changed"
  | "file_added"
  | "file_removed"
  | "dependency_added"
  | "dependency_removed"
  | "subitem_added"
  | "time_logged"
  | "shared_with_guests";

interface TaskActivityAttributes {
  id: string;
  taskId: string;
  /** Null for system-generated entries (automation, scheduled jobs). */
  userId: string | null;
  type: TaskActivityType;
  /** Human-readable summary, rendered as-is; details carries the structured form. */
  summary: string;
  details: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskActivityCreationAttributes
  extends Optional<TaskActivityAttributes, "id" | "userId" | "details"> {}

/**
 * The task's audit trail — what the detail drawer interleaves with comments to
 * form one timeline.
 *
 * The summary is denormalised on write rather than reconstructed on read: a
 * status rename or a deleted user must not retroactively rewrite history.
 */
export class TaskActivity
  extends Model<TaskActivityAttributes, TaskActivityCreationAttributes>
  implements TaskActivityAttributes
{
  declare id: string;
  declare taskId: string;
  declare userId: string | null;
  declare type: TaskActivityType;
  declare summary: string;
  declare details: Record<string, unknown> | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TaskActivity.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    taskId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: true },
    type: {
      type: DataTypes.ENUM(
        "created", "title_changed", "status_changed", "assignee_changed", "dates_changed",
        "priority_changed", "description_changed", "field_changed", "file_added", "file_removed",
        "dependency_added", "dependency_removed", "subitem_added", "time_logged", "shared_with_guests"
      ),
      allowNull: false,
    },
    summary: { type: DataTypes.STRING, allowNull: false },
    details: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    sequelize,
    tableName: "task_activities",
    timestamps: true,
    indexes: [{ fields: ["taskId", "createdAt"] }],
  }
);
