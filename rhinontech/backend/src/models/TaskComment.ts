import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface TaskCommentAttributes {
  id: string;
  taskId: string;
  userId: string;
  body: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskCommentCreationAttributes extends Optional<TaskCommentAttributes, "id"> {}

export class TaskComment extends Model<TaskCommentAttributes, TaskCommentCreationAttributes> implements TaskCommentAttributes {
  declare id: string;
  declare taskId: string;
  declare userId: string;
  declare body: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TaskComment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    taskId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
  },
  { sequelize, tableName: "task_comments", timestamps: true }
);
