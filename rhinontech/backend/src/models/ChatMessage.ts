import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * One line of a website chat. `role` uses the widget's own vocabulary
 * ("user" = visitor, "bot" = AI, "support" = a human agent) so transcripts go
 * back to it unchanged.
 */
export type ChatMessageRole = "user" | "bot" | "support" | "system";
/**
 * Which part of the chat a line belongs to. The widget shows the AI part and
 * the human part as two lists with a divider (`/chat_history` vs
 * `/conversations/socketConversation`), so each line remembers its side.
 */
export type ChatMessagePhase = "bot" | "human";

export interface ChatAttachment {
  key: string;
  name: string;
  size?: number;
  mimeType?: string;
}

interface ChatMessageAttributes {
  id: string;
  conversationId: string;
  role: ChatMessageRole;
  phase: ChatMessagePhase;
  text: string;
  attachments: ChatAttachment[];
  agentUserId?: string | null;
  agentName?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatMessageCreationAttributes
  extends Optional<ChatMessageAttributes, "id" | "phase" | "attachments" | "agentUserId" | "agentName"> {}

export class ChatMessage
  extends Model<ChatMessageAttributes, ChatMessageCreationAttributes>
  implements ChatMessageAttributes
{
  declare id: string;
  declare conversationId: string;
  declare role: ChatMessageRole;
  declare phase: ChatMessagePhase;
  declare text: string;
  declare attachments: ChatAttachment[];
  declare agentUserId: string | null;
  declare agentName: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ChatMessage.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    conversationId: { type: DataTypes.UUID, allowNull: false },
    role: { type: DataTypes.ENUM("user", "bot", "support", "system"), allowNull: false },
    phase: { type: DataTypes.ENUM("bot", "human"), allowNull: false, defaultValue: "bot" },
    text: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    attachments: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    agentUserId: { type: DataTypes.UUID, allowNull: true },
    agentName: { type: DataTypes.STRING(200), allowNull: true },
  },
  {
    sequelize,
    tableName: "chat_messages",
    timestamps: true,
    indexes: [{ fields: ["conversationId", "createdAt"] }],
  }
);
