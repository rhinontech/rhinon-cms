import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type CampaignStage = "Draft" | "Active" | "Paused" | "Completed";
export type CampaignChannel = "Email" | "Cold Email" | "LinkedIn DM" | "LinkedIn Connection" | "LinkedIn Post" | "LinkedIn Video" | "LinkedIn Article";

interface CampaignAttributes {
  id: string;
  name: string;
  channel: CampaignChannel;
  templateId?: string | null;
  stage: CampaignStage;
  dailyLimit: number;
  startDate: Date;
  runTime: string;
  scheduleDays: string[];
  leadsTotal: number;
  leadsProcessed: number;
  objective?: string;
  notes?: string;
  // Social/LinkedIn fields
  mediaUrl?: string | null;
  aiDraft?: string | null;
  visibility?: "PUBLIC" | "CONNECTIONS";
  mediaTitle?: string | null;
  mediaDescription?: string | null;
  articleUrl?: string | null;
  slug?: string | null;
  platformPostId?: string | null;
  organizationId?: string | null;
  socialStats?: {
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    lastUpdated?: string;
  } | null;
  createdById: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CampaignCreationAttributes extends Optional<CampaignAttributes, "id" | "channel" | "templateId" | "stage" | "dailyLimit" | "startDate" | "runTime" | "scheduleDays" | "leadsTotal" | "leadsProcessed" | "objective" | "notes" | "mediaUrl" | "aiDraft" | "visibility" | "mediaTitle" | "mediaDescription" | "articleUrl" | "slug" | "platformPostId" | "organizationId" | "socialStats"> {}

export class Campaign extends Model<CampaignAttributes, CampaignCreationAttributes> implements CampaignAttributes {
  declare id: string;
  declare name: string;
  declare channel: CampaignChannel;
  declare templateId: string | null;
  declare stage: CampaignStage;
  declare dailyLimit: number;
  declare startDate: Date;
  declare runTime: string;
  declare scheduleDays: string[];
  declare leadsTotal: number;
  declare leadsProcessed: number;
  declare objective: string;
  declare notes: string;
  declare mediaUrl: string | null;
  declare aiDraft: string | null;
  declare visibility: "PUBLIC" | "CONNECTIONS";
  declare mediaTitle: string | null;
  declare mediaDescription: string | null;
  declare articleUrl: string | null;
  declare slug: string | null;
  declare platformPostId: string | null;
  declare organizationId: string | null;
  declare socialStats: any;
  declare createdById: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Campaign.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    templateId: { type: DataTypes.UUID, allowNull: true },
    stage: {
      type: DataTypes.ENUM("Draft", "Active", "Paused", "Completed"),
      defaultValue: "Draft",
      allowNull: false,
    },
    channel: {
      type: DataTypes.ENUM("Email", "Cold Email", "LinkedIn DM", "LinkedIn Connection", "LinkedIn Post", "LinkedIn Video", "LinkedIn Article"),
      defaultValue: "Email",
      allowNull: false,
    },
    dailyLimit: { type: DataTypes.INTEGER, defaultValue: 50, allowNull: false },
    startDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
    runTime: { type: DataTypes.STRING(5), defaultValue: "09:00", allowNull: false },
    scheduleDays: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: ["Mon", "Tue", "Wed", "Thu", "Fri"], allowNull: false },
    leadsTotal: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    leadsProcessed: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    objective: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    mediaUrl: { type: DataTypes.TEXT, allowNull: true },
    aiDraft: { type: DataTypes.TEXT, allowNull: true },
    visibility: { type: DataTypes.ENUM("PUBLIC", "CONNECTIONS"), defaultValue: "PUBLIC", allowNull: true },
    mediaTitle: { type: DataTypes.STRING, allowNull: true },
    mediaDescription: { type: DataTypes.TEXT, allowNull: true },
    articleUrl: { type: DataTypes.TEXT, allowNull: true },
    slug: { type: DataTypes.STRING, allowNull: true, unique: true },
    platformPostId: { type: DataTypes.STRING, allowNull: true },
    organizationId: { type: DataTypes.STRING, allowNull: true },
    socialStats: { type: DataTypes.JSONB, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: false },
  },
  { sequelize, tableName: "campaigns", timestamps: true }
);
