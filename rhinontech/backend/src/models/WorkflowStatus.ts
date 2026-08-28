import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * Which bucket a custom status rolls up into. Wrike's model: a project may
 * invent any number of statuses, but each belongs to a group so that "is this
 * done?" stays answerable without knowing the project's vocabulary.
 */
export type StatusGroup = "New" | "Active" | "Completed" | "Cancelled";

interface WorkflowStatusAttributes {
  id: string;
  /** null = company-wide default set; set = this project's own workflow. */
  projectId: string | null;
  name: string;
  color: string;
  group: StatusGroup;
  order: number;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WorkflowStatusCreationAttributes
  extends Optional<WorkflowStatusAttributes, "id" | "projectId" | "color" | "group" | "order" | "isDefault"> {}

export class WorkflowStatus
  extends Model<WorkflowStatusAttributes, WorkflowStatusCreationAttributes>
  implements WorkflowStatusAttributes
{
  declare id: string;
  declare projectId: string | null;
  declare name: string;
  declare color: string;
  declare group: StatusGroup;
  declare order: number;
  declare isDefault: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

WorkflowStatus.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: false },
    color: { type: DataTypes.STRING, allowNull: false, defaultValue: "blue" },
    group: {
      type: DataTypes.ENUM("New", "Active", "Completed", "Cancelled"),
      allowNull: false,
      defaultValue: "Active",
    },
    order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    /** The status a new task lands in for this workflow. */
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, tableName: "workflow_statuses", timestamps: true, indexes: [{ fields: ["projectId"] }] }
);
