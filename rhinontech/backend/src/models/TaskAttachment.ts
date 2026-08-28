import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface TaskAttachmentAttributes {
  id: string;
  taskId: string;
  name: string;
  key: string;
  mimeType: string;
  size: number;
  uploadedById: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskAttachmentCreationAttributes extends Optional<TaskAttachmentAttributes, "id"> {}

/** Same shape as PageAttachment — S3 key plus metadata; the Files tab reads this. */
export class TaskAttachment
  extends Model<TaskAttachmentAttributes, TaskAttachmentCreationAttributes>
  implements TaskAttachmentAttributes
{
  declare id: string;
  declare taskId: string;
  declare name: string;
  declare key: string;
  declare mimeType: string;
  declare size: number;
  declare uploadedById: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TaskAttachment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    taskId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    key: { type: DataTypes.STRING, allowNull: false },
    mimeType: { type: DataTypes.STRING, allowNull: false },
    size: { type: DataTypes.INTEGER, allowNull: false },
    uploadedById: { type: DataTypes.UUID, allowNull: false },
  },
  { sequelize, tableName: "task_attachments", timestamps: true, indexes: [{ fields: ["taskId"] }] }
);
