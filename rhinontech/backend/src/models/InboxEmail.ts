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
  // {key,name,size,mimeType} objects; S3 keys under inbox/, presigned per-request
  attachments?: { key: string; name: string; size: number; mimeType: string }[];
  // Team-only note pinned to the thread — never emailed, hidden from folder lists
  isInternal?: boolean;
  // RFC 5322 ids for reply threading (inbound replies join the original thread)
  messageId?: string | null;
  inReplyTo?: string | null;
  sentAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InboxEmailCreationAttributes
  extends Optional<
    InboxEmailAttributes,
    "id" | "folder" | "ccEmails" | "isRead" | "isStarred" | "hasAttachment" | "attachments" | "isInternal" | "messageId" | "inReplyTo"
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
  declare attachments: { key: string; name: string; size: number; mimeType: string }[];
  declare isInternal: boolean;
  declare messageId: string | null;
  declare inReplyTo: string | null;
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
    attachments: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    isInternal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    messageId: {
      type: DataTypes.STRING,
    },
    inReplyTo: {
      type: DataTypes.STRING,
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
