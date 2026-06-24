import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type InboxConversationStatus = "open" | "in_progress" | "resolved" | "closed";
export type InboxConversationPriority = "low" | "normal" | "high" | "urgent";

interface InboxConversationAttributes {
  id: string;
  subject: string;
  status: InboxConversationStatus;
  priority: InboxConversationPriority;
  source: string;
  customerName: string;
  customerEmail: string;
  customerCompany?: string | null;
  customerLocation?: string | null;
  language: string;
  brand: string;
  externalId?: string | null;
  workspacePhoneNumber?: string | null;
  copilotUsed: boolean;
  assignedToUserId?: string | null;
  teamInbox: string;
  topics: string[];
  tags: string[];
  lastMessagePreview: string;
  lastMessageAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InboxConversationCreationAttributes
  extends Optional<
    InboxConversationAttributes,
    | "id"
    | "status"
    | "priority"
    | "customerCompany"
    | "customerLocation"
    | "externalId"
    | "workspacePhoneNumber"
    | "copilotUsed"
    | "assignedToUserId"
    | "teamInbox"
    | "topics"
    | "tags"
  > {}

export class InboxConversation
  extends Model<InboxConversationAttributes, InboxConversationCreationAttributes>
  implements InboxConversationAttributes
{
  declare id: string;
  declare subject: string;
  declare status: InboxConversationStatus;
  declare priority: InboxConversationPriority;
  declare source: string;
  declare customerName: string;
  declare customerEmail: string;
  declare customerCompany: string | null;
  declare customerLocation: string | null;
  declare language: string;
  declare brand: string;
  declare externalId: string | null;
  declare workspacePhoneNumber: string | null;
  declare copilotUsed: boolean;
  declare assignedToUserId: string | null;
  declare teamInbox: string;
  declare topics: string[];
  declare tags: string[];
  declare lastMessagePreview: string;
  declare lastMessageAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
}

InboxConversation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("open", "in_progress", "resolved", "closed"),
      allowNull: false,
      defaultValue: "open",
    },
    priority: {
      type: DataTypes.ENUM("low", "normal", "high", "urgent"),
      allowNull: false,
      defaultValue: "normal",
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerCompany: {
      type: DataTypes.STRING,
    },
    customerLocation: {
      type: DataTypes.STRING,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "English",
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Rhinon",
    },
    externalId: {
      type: DataTypes.STRING,
    },
    workspacePhoneNumber: {
      type: DataTypes.STRING,
    },
    copilotUsed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    assignedToUserId: {
      type: DataTypes.UUID,
    },
    teamInbox: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Support",
    },
    topics: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    lastMessagePreview: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "inbox_conversations",
    timestamps: true,
  }
);
