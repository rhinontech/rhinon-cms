import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type InboxEmailFolder = "inbox" | "sent" | "drafts" | "archive" | "trash";

interface InboxEmailAttributes {
  id: string;
  threadKey: string;
  folder: InboxEmailFolder;
  fromName: string;
  fromEmail: string;
  toEmails: string[];
  ccEmails: string[];
  subject: string;
  body: string;
  snippet: string;
  ownerEmail: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachment: boolean;
  sentAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InboxEmailCreationAttributes
  extends Optional<
    InboxEmailAttributes,
    "id" | "folder" | "ccEmails" | "isRead" | "isStarred" | "hasAttachment"
  > {}

export class InboxEmail
  extends Model<InboxEmailAttributes, InboxEmailCreationAttributes>
  implements InboxEmailAttributes
{
  declare id: string;
  declare threadKey: string;
  declare folder: InboxEmailFolder;
  declare fromName: string;
  declare fromEmail: string;
  declare toEmails: string[];
  declare ccEmails: string[];
  declare subject: string;
  declare body: string;
  declare snippet: string;
  declare ownerEmail: string;
  declare isRead: boolean;
  declare isStarred: boolean;
  declare hasAttachment: boolean;
  declare sentAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
}

InboxEmail.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    threadKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    folder: {
      type: DataTypes.ENUM("inbox", "sent", "drafts", "archive", "trash"),
      allowNull: false,
      defaultValue: "inbox",
    },
    fromName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fromEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    toEmails: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    ccEmails: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    snippet: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ownerEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "admin@rhinontech.in",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isStarred: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    hasAttachment: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "inbox_emails",
    timestamps: true,
  }
);
