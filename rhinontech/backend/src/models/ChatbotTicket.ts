import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * A support ticket a visitor raised from the website widget ("Raise a ticket").
 * Replaces the interim tickets that were stored as `meta.ticket` conversations.
 *
 * `code` is the short id the visitor sees in "Your tickets" (8 characters) and
 * the one the widget sends back when rating. The thread lives in
 * ChatbotTicketMessage; agent replies are also emailed to the visitor.
 */
export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

interface ChatbotTicketAttributes {
  id: string;
  chatbotId: string;
  code: string;
  subject: string;
  customerEmail: string;
  customerName?: string | null;
  /** The ticket form's other answers, as the visitor sent them. */
  customData: Record<string, unknown>;
  status: TicketStatus;
  priority: TicketPriority;
  tags: string[];
  assignedUserId?: string | null;
  rating?: number | null;
  leadId?: string | null;
  /** New since an agent last opened it. */
  isNew: boolean;
  lastActivityAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatbotTicketCreationAttributes
  extends Optional<
    ChatbotTicketAttributes,
    "id" | "customerName" | "customData" | "status" | "priority" | "tags" | "assignedUserId" | "rating" | "leadId" | "isNew" | "lastActivityAt"
  > {}

export class ChatbotTicket
  extends Model<ChatbotTicketAttributes, ChatbotTicketCreationAttributes>
  implements ChatbotTicketAttributes
{
  declare id: string;
  declare chatbotId: string;
  declare code: string;
  declare subject: string;
  declare customerEmail: string;
  declare customerName: string | null;
  declare customData: Record<string, unknown>;
  declare status: TicketStatus;
  declare priority: TicketPriority;
  declare tags: string[];
  declare assignedUserId: string | null;
  declare rating: number | null;
  declare leadId: string | null;
  declare isNew: boolean;
  declare lastActivityAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ChatbotTicket.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    chatbotId: { type: DataTypes.UUID, allowNull: false },
    code: { type: DataTypes.STRING(8), allowNull: false, unique: true },
    subject: { type: DataTypes.STRING(200), allowNull: false },
    customerEmail: { type: DataTypes.STRING(254), allowNull: false },
    customerName: { type: DataTypes.STRING(120), allowNull: true },
    customData: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    status: { type: DataTypes.ENUM("open", "pending", "resolved", "closed"), allowNull: false, defaultValue: "open" },
    priority: { type: DataTypes.ENUM("low", "medium", "high", "urgent"), allowNull: false, defaultValue: "medium" },
    tags: { type: DataTypes.ARRAY(DataTypes.STRING(40)), allowNull: false, defaultValue: [] },
    assignedUserId: { type: DataTypes.UUID, allowNull: true },
    rating: { type: DataTypes.INTEGER, allowNull: true },
    leadId: { type: DataTypes.UUID, allowNull: true },
    isNew: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastActivityAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: "chatbot_tickets",
    timestamps: true,
    indexes: [{ fields: ["chatbotId", "status"] }, { fields: ["chatbotId", "customerEmail"] }],
  }
);
