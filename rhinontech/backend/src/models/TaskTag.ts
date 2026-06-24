import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface TaskTagAttributes {
  id: string;
  taskId: string;
  label: string;
  color: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskTagCreationAttributes extends Optional<TaskTagAttributes, "id"> {}

export class TaskTag extends Model<TaskTagAttributes, TaskTagCreationAttributes> implements TaskTagAttributes {
  declare id: string;
  declare taskId: string;
  declare label: string;
  declare color: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TaskTag.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    taskId: { type: DataTypes.UUID, allowNull: false },
    label: { type: DataTypes.STRING, allowNull: false },
    color: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "blue" },
  },
  { sequelize, tableName: "task_tags", timestamps: true }
);
