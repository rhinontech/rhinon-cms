import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * A targeted pop-up the website widget shows above its launcher — a greeting,
 * an offer, a lead magnet. Ported from Saleszium's chatbot campaigns.
 *
 * `content` and `targeting` are stored in the widget's own shapes
 * (bot-sdk/src/types/campaign.types.ts) so the widget reads them unchanged:
 *   content   { templateId, layout, heading, subheading, hasImage, media, buttons[] }
 *   targeting { visitorType, trigger { type, value, unit }, rules { matchType, conditions[] } }
 *
 * "recurring" shows whenever the targeting matches; "one-time" once per visitor
 * (the widget remembers it in the visitor's browser).
 */
export type CampaignType = "recurring" | "one-time";
export type CampaignStatus = "draft" | "active" | "paused";

interface ChatbotCampaignAttributes {
  id: string;
  chatbotId: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  content: Record<string, unknown>;
  targeting: Record<string, unknown>;
  /** Optional window; outside it an active campaign is not served. */
  startsAt?: Date | null;
  endsAt?: Date | null;
  impressions: number;
  clicks: number;
  closes: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatbotCampaignCreationAttributes
  extends Optional<
    ChatbotCampaignAttributes,
    "id" | "type" | "status" | "content" | "targeting" | "startsAt" | "endsAt" | "impressions" | "clicks" | "closes"
  > {}

export class ChatbotCampaign
  extends Model<ChatbotCampaignAttributes, ChatbotCampaignCreationAttributes>
  implements ChatbotCampaignAttributes
{
  declare id: string;
  declare chatbotId: string;
  declare name: string;
  declare type: CampaignType;
  declare status: CampaignStatus;
  declare content: Record<string, unknown>;
  declare targeting: Record<string, unknown>;
  declare startsAt: Date | null;
  declare endsAt: Date | null;
  declare impressions: number;
  declare clicks: number;
  declare closes: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ChatbotCampaign.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    chatbotId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    type: { type: DataTypes.ENUM("recurring", "one-time"), allowNull: false, defaultValue: "recurring" },
    status: { type: DataTypes.ENUM("draft", "active", "paused"), allowNull: false, defaultValue: "draft" },
    content: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    targeting: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    startsAt: { type: DataTypes.DATE, allowNull: true },
    endsAt: { type: DataTypes.DATE, allowNull: true },
    impressions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    clicks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    closes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, tableName: "chatbot_campaigns", timestamps: true, indexes: [{ fields: ["chatbotId", "status"] }] }
);
