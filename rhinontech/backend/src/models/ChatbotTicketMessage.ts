import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * One entry in a ticket's thread: the visitor's message, an agent's reply
 * (emailed to the visitor) or an internal note (never leaves the team).
 */
export type TicketMessageRole = "customer" | "agent" | "note";

interface ChatbotTicketMessageAttributes {
  id: string;
  ticketId: string;
  role: TicketMessageRole;
  authorUserId?: string | null;
  text: string;
  /** Agent replies only: whether the email went out. */
  emailed?: boolean | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatbotTicketMessageCreationAttributes
  extends Optional<ChatbotTicketMessageAttributes, "id" | "authorUserId" | "emailed"> {}

export class ChatbotTicketMessage
  extends Model<ChatbotTicketMessageAttributes, ChatbotTicketMessageCreationAttributes>
  implements ChatbotTicketMessageAttributes
{
  declare id: string;
  declare ticketId: string;
  declare role: TicketMessageRole;
  declare authorUserId: string | null;
  declare text: string;
  declare emailed: boolean | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ChatbotTicketMessage.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ticketId: { type: DataTypes.UUID, allowNull: false },
    role: { type: DataTypes.ENUM("customer", "agent", "note"), allowNull: false },
    authorUserId: { type: DataTypes.UUID, allowNull: true },
    text: { type: DataTypes.TEXT, allowNull: false },
    emailed: { type: DataTypes.BOOLEAN, allowNull: true },
  },
  { sequelize, tableName: "chatbot_ticket_messages", timestamps: true, indexes: [{ fields: ["ticketId", "createdAt"] }] }
);
