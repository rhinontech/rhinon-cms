import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * One thing the bot is trained on: a page, a whole site via its sitemap, an
 * uploaded file, or pasted text. Saleszium kept these as JSON arrays on a single
 * row; a row each gives every source its own status and error, so one dead URL
 * no longer hides behind "training failed".
 *
 * The text itself lives in chatbot_chunks (raw pgvector table, see
 * services/chatbot/vectorStore.ts), keyed by this id.
 */
export type ChatbotSourceKind = "url" | "sitemap" | "file" | "text";
export type ChatbotSourceStatus = "pending" | "training" | "trained" | "failed";

interface ChatbotSourceAttributes {
  id: string;
  chatbotId: string;
  kind: ChatbotSourceKind;
  title: string;
  url?: string | null;
  /** S3 key of an uploaded file (kind = file). */
  fileKey?: string | null;
  fileName?: string | null;
  /** Pasted text (kind = text). */
  content?: string | null;
  status: ChatbotSourceStatus;
  error?: string | null;
  chunkCount: number;
  /** Pages read — 1 for a url, the sitemap's page count for a sitemap. */
  pageCount: number;
  trainedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatbotSourceCreationAttributes
  extends Optional<
    ChatbotSourceAttributes,
    "id" | "url" | "fileKey" | "fileName" | "content" | "status" | "error"
    | "chunkCount" | "pageCount" | "trainedAt"
  > {}

export class ChatbotSource
  extends Model<ChatbotSourceAttributes, ChatbotSourceCreationAttributes>
  implements ChatbotSourceAttributes
{
  declare id: string;
  declare chatbotId: string;
  declare kind: ChatbotSourceKind;
  declare title: string;
  declare url: string | null;
  declare fileKey: string | null;
  declare fileName: string | null;
  declare content: string | null;
  declare status: ChatbotSourceStatus;
  declare error: string | null;
  declare chunkCount: number;
  declare pageCount: number;
  declare trainedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ChatbotSource.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    chatbotId: { type: DataTypes.UUID, allowNull: false },
    kind: { type: DataTypes.ENUM("url", "sitemap", "file", "text"), allowNull: false },
    title: { type: DataTypes.STRING(500), allowNull: false },
    url: { type: DataTypes.TEXT, allowNull: true },
    fileKey: { type: DataTypes.STRING(500), allowNull: true },
    fileName: { type: DataTypes.STRING(300), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM("pending", "training", "trained", "failed"),
      allowNull: false,
      defaultValue: "pending",
    },
    error: { type: DataTypes.TEXT, allowNull: true },
    chunkCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    pageCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    trainedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: "chatbot_sources", timestamps: true, indexes: [{ fields: ["chatbotId"] }] }
);
