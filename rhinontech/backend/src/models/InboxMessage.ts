import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type InboxMessageSenderType = "customer" | "agent" | "system";

interface InboxMessageAttributes {
  id: string;
  conversationId: string;
  senderType: InboxMessageSenderType;
  senderName: string;
  body: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InboxMessageCreationAttributes
  extends Optional<InboxMessageAttributes, "id"> {}

export class InboxMessage
  extends Model<InboxMessageAttributes, InboxMessageCreationAttributes>
  implements InboxMessageAttributes
{
  declare id: string;
  declare conversationId: string;
  declare senderType: InboxMessageSenderType;
  declare senderName: string;
  declare body: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

InboxMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    senderType: {
      type: DataTypes.ENUM("customer", "agent", "system"),
      allowNull: false,
    },
    senderName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "inbox_messages",
    timestamps: true,
  }
);
