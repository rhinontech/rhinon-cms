import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type TemplateChannel = "Email" | "Cold Email" | "LinkedIn Post" | "LinkedIn Video" | "LinkedIn Article" | "LinkedIn DM" | "LinkedIn Connection";

interface CampaignTemplateAttributes {
  id: string;
  name: string;
  channel: TemplateChannel;
  subject?: string;
  body: string;
  imageUrl?: string;
  aiInstructions?: string;
  // Social / LinkedIn fields
  visibility?: "PUBLIC" | "CONNECTIONS";
  mediaTitle?: string;
  mediaDescription?: string;
  articleUrl?: string;
  createdById: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CampaignTemplateCreationAttributes
  extends Optional<CampaignTemplateAttributes, "id" | "channel" | "subject" | "imageUrl" | "aiInstructions" | "visibility" | "mediaTitle" | "mediaDescription" | "articleUrl"> {}

export class CampaignTemplate
  extends Model<CampaignTemplateAttributes, CampaignTemplateCreationAttributes>
  implements CampaignTemplateAttributes {
  declare id: string;
  declare name: string;
  declare channel: TemplateChannel;
  declare subject: string;
  declare body: string;
  declare imageUrl: string;
  declare aiInstructions: string;
  declare visibility: "PUBLIC" | "CONNECTIONS";
  declare mediaTitle: string;
  declare mediaDescription: string;
  declare articleUrl: string;
  declare createdById: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CampaignTemplate.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    channel: {
      type: DataTypes.ENUM("Email", "Cold Email", "LinkedIn Post", "LinkedIn Video", "LinkedIn Article", "LinkedIn DM", "LinkedIn Connection"),
      defaultValue: "Email",
      allowNull: false,
    },
    subject: { type: DataTypes.STRING, allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false },
    imageUrl: { type: DataTypes.TEXT, allowNull: true },
    aiInstructions: { type: DataTypes.TEXT, allowNull: true },
    visibility: { type: DataTypes.ENUM("PUBLIC", "CONNECTIONS"), defaultValue: "PUBLIC", allowNull: true },
    mediaTitle: { type: DataTypes.STRING, allowNull: true },
    mediaDescription: { type: DataTypes.TEXT, allowNull: true },
    articleUrl: { type: DataTypes.TEXT, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: false },
  },
  { sequelize, tableName: "campaign_templates", timestamps: true }
);
