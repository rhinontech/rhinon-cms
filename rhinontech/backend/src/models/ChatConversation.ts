import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * One website chat. Saleszium kept the bot part (bot_conversations) and the
 * human part (support_conversations) as two copies of the same chat; here it is
 * one record whose `mode` flips from "bot" to "human" when an agent takes over
 * or the visitor asks for one.
 *
 * `publicKey` is the conversation id the widget holds (its `conversation_id` /
 * `chatbot_history`). It is unguessable and, together with the visitor id, is
 * the only thing a public caller can use to read a chat back.
 */
export type ChatConversationMode = "bot" | "human";
export type ChatConversationStatus = "open" | "closed";

interface ChatConversationAttributes {
  id: string;
  siteId?: string | null;
  chatbotId: string;
  publicKey: string;
  /** The widget's anonymous visitor id (persisted in the visitor's browser). */
  visitorId: string;
  visitorEmail?: string | null;
  visitorName?: string | null;
  visitorPhone?: string | null;
  title: string;
  mode: ChatConversationMode;
  status: ChatConversationStatus;
  assignedUserId?: string | null;
  lastMessageAt: Date;
  lastMessagePreview?: string | null;
  /** Visitor messages since an agent last opened the chat. */
  unreadCount: number;
  isPinned: boolean;
  /** Post-chat form answers (rating, comment …). */
  review?: Record<string, unknown> | null;
  leadId?: string | null;
  /** ip, city, country, pageUrl, userAgent — whatever the first message carried. */
  meta: Record<string, unknown>;
  closedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatConversationCreationAttributes
  extends Optional<
    ChatConversationAttributes,
    "id" | "siteId" | "visitorEmail" | "visitorName" | "visitorPhone" | "title" | "mode"
    | "status" | "assignedUserId" | "lastMessageAt" | "lastMessagePreview" | "unreadCount"
    | "isPinned" | "review" | "leadId" | "meta" | "closedAt"
  > {}

export class ChatConversation
  extends Model<ChatConversationAttributes, ChatConversationCreationAttributes>
  implements ChatConversationAttributes
{
  declare id: string;
  declare siteId: string | null;
  declare chatbotId: string;
  declare publicKey: string;
  declare visitorId: string;
  declare visitorEmail: string | null;
  declare visitorName: string | null;
  declare visitorPhone: string | null;
  declare title: string;
  declare mode: ChatConversationMode;
  declare status: ChatConversationStatus;
  declare assignedUserId: string | null;
  declare lastMessageAt: Date;
  declare lastMessagePreview: string | null;
  declare unreadCount: number;
  declare isPinned: boolean;
  declare review: Record<string, unknown> | null;
  declare leadId: string | null;
  declare meta: Record<string, unknown>;
  declare closedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ChatConversation.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    siteId: { type: DataTypes.UUID, allowNull: true },
    chatbotId: { type: DataTypes.UUID, allowNull: false },
    publicKey: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    visitorId: { type: DataTypes.STRING(128), allowNull: false },
    visitorEmail: { type: DataTypes.STRING(320), allowNull: true },
    visitorName: { type: DataTypes.STRING(200), allowNull: true },
    visitorPhone: { type: DataTypes.STRING(50), allowNull: true },
    title: { type: DataTypes.STRING(300), allowNull: false, defaultValue: "New chat" },
    mode: { type: DataTypes.ENUM("bot", "human"), allowNull: false, defaultValue: "bot" },
    status: { type: DataTypes.ENUM("open", "closed"), allowNull: false, defaultValue: "open" },
    assignedUserId: { type: DataTypes.UUID, allowNull: true },
    lastMessageAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    lastMessagePreview: { type: DataTypes.STRING(300), allowNull: true },
    unreadCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isPinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    review: { type: DataTypes.JSONB, allowNull: true },
    leadId: { type: DataTypes.UUID, allowNull: true },
    meta: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    closedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "chat_conversations",
    timestamps: true,
    indexes: [{ fields: ["chatbotId", "lastMessageAt"] }, { fields: ["visitorId"] }],
  }
);
