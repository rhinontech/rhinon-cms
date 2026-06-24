import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type CampaignActivityType = "Enrichment" | "DraftGenerated" | "OutreachSent" | "ReplyReceived" | "Other";

interface CampaignActivityAttributes {
  id: string;
  leadId: string;
  campaignId?: string | null;
  type: CampaignActivityType;
  content: string;
  generatedContent?: string;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CampaignActivityCreationAttributes extends Optional<CampaignActivityAttributes, "id" | "campaignId" | "generatedContent" | "timestamp"> {}

export class CampaignActivity extends Model<CampaignActivityAttributes, CampaignActivityCreationAttributes> implements CampaignActivityAttributes {
  declare id: string;
  declare leadId: string;
  declare campaignId: string | null;
  declare type: CampaignActivityType;
  declare content: string;
  declare generatedContent: string;
  declare timestamp: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CampaignActivity.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    leadId: { type: DataTypes.UUID, allowNull: false },
    campaignId: { type: DataTypes.UUID, allowNull: true },
    type: {
      type: DataTypes.ENUM("Enrichment", "DraftGenerated", "OutreachSent", "ReplyReceived", "Other"),
      defaultValue: "Other",
      allowNull: false,
    },
    content: { type: DataTypes.TEXT, allowNull: false },
    generatedContent: { type: DataTypes.TEXT, allowNull: true },
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
  },
  { sequelize, tableName: "campaign_activities", timestamps: true }
);
