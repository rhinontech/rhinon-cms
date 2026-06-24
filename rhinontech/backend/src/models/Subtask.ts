import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface SubtaskAttributes {
  id: string;
  taskId: string;
  title: string;
  done: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SubtaskCreationAttributes extends Optional<SubtaskAttributes, "id" | "done" | "order"> {}

export class Subtask extends Model<SubtaskAttributes, SubtaskCreationAttributes> implements SubtaskAttributes {
  declare id: string;
  declare taskId: string;
  declare title: string;
  declare done: boolean;
  declare order: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Subtask.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    taskId: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    done: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    order: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  },
  { sequelize, tableName: "subtasks", timestamps: true }
);
