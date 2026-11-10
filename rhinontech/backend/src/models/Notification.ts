import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface NotificationAttributes {
  id: string;
  userId: string;
  /** Dotted event name, e.g. "task.assigned". */
  type: string;
  title: string;
  body: string | null;
  /** Path after the role segment, e.g. "/work/tasks". Access is rechecked when it opens. */
  link: string | null;
  actorId: string | null;
  /** Unread notifications sharing a key collapse into one with a count. */
  groupKey: string | null;
  count: number;
  readAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Notification
  extends Model<NotificationAttributes, Optional<NotificationAttributes, "id" | "body" | "link" | "actorId" | "groupKey" | "count" | "readAt">>
  implements NotificationAttributes
{
  declare id: string;
  declare userId: string;
  declare type: string;
  declare title: string;
  declare body: string | null;
  declare link: string | null;
  declare actorId: string | null;
  declare groupKey: string | null;
  declare count: number;
  declare readAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Notification.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.STRING(50), allowNull: false },
    title: { type: DataTypes.STRING(300), allowNull: false },
    body: { type: DataTypes.STRING(500), allowNull: true },
    link: { type: DataTypes.STRING(300), allowNull: true },
    actorId: { type: DataTypes.UUID, allowNull: true },
    groupKey: { type: DataTypes.STRING(150), allowNull: true },
    count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    readAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "notifications",
    timestamps: true,
    indexes: [{ fields: ["userId", "createdAt"] }, { fields: ["userId", "readAt"] }, { fields: ["userId", "groupKey"] }],
  }
);
