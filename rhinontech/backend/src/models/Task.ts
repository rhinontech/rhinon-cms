import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

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
  dueDate?: Date;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedHours?: number | null;
  recurrence?: TaskRecurrence | null;
  blockedById?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskCreationAttributes
  extends Optional<TaskAttributes, "id" | "description" | "assigneeId" | "projectId" | "team" | "dueDate" | "status" | "priority" | "estimatedHours" | "recurrence" | "blockedById"> {}

export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  declare id: string;
  declare title: string;
  declare description?: string;
  declare assigneeId?: string;
  declare createdById: string;
  declare projectId?: string;
  declare team?: string;
  declare dueDate?: Date;
  declare status: TaskStatus;
  declare priority: TaskPriority;
  declare estimatedHours: number | null;
  declare recurrence: TaskRecurrence | null;
  declare blockedById: string | null;
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
    dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.ENUM("Pending", "In progress", "Done"), defaultValue: "Pending" },
    priority: { type: DataTypes.ENUM("Low", "Medium", "High"), defaultValue: "Medium", allowNull: false },
    estimatedHours: { type: DataTypes.FLOAT, allowNull: true },
    recurrence: { type: DataTypes.ENUM("Daily", "Weekly", "Monthly"), allowNull: true },
    blockedById: { type: DataTypes.UUID, allowNull: true },
  },
  { sequelize, tableName: "tasks", timestamps: true }
);
