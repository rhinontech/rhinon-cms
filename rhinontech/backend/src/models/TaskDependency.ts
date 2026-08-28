import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/** Finish-to-start is the Gantt default; the other three complete the standard set. */
export type DependencyType = "FS" | "SS" | "FF" | "SF";

interface TaskDependencyAttributes {
  id: string;
  predecessorId: string;
  successorId: string;
  type: DependencyType;
  /** Offset in days; negative overlaps the two bars. */
  lagDays: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskDependencyCreationAttributes
  extends Optional<TaskDependencyAttributes, "id" | "type" | "lagDays"> {}

/**
 * Replaces Task.blockedById, which could only express one blocker. A Gantt
 * chart needs a graph, not a single edge.
 */
export class TaskDependency
  extends Model<TaskDependencyAttributes, TaskDependencyCreationAttributes>
  implements TaskDependencyAttributes
{
  declare id: string;
  declare predecessorId: string;
  declare successorId: string;
  declare type: DependencyType;
  declare lagDays: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TaskDependency.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    predecessorId: { type: DataTypes.UUID, allowNull: false },
    successorId: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.ENUM("FS", "SS", "FF", "SF"), allowNull: false, defaultValue: "FS" },
    lagDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: "task_dependencies",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["predecessorId", "successorId"] },
      { fields: ["successorId"] },
    ],
  }
);
