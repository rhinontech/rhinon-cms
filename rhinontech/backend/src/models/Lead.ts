import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type LeadStatus = "New" | "Enriched" | "Enrolled" | "Emailed" | "Replied" | "Bounced" | "Unsubscribed" | "Interested";

interface LeadAttributes {
  id: string;
  name: string;
  company: string;
  title?: string;
  email: string;
  linkedinUrl?: string;
  // Enrichment fields (e.g. populated from an Apollo CSV import)
  phone?: string;
  seniority?: string;
  department?: string;
  industry?: string;
  employeeCount?: number | null;
  location?: string;
  website?: string;
  companyLinkedinUrl?: string;
  emailStatus?: string;
  emailConfidence?: string;
  keywords?: string;
  technologies?: string;
  annualRevenue?: string;
  apolloContactId?: string;
  raw?: Record<string, any> | null;
  enrichment?: Record<string, any> | null;
  draftSubject?: string;
  draftApproved?: boolean;
  status: LeadStatus;
  campaignId?: string | null;
  aiDraft?: string;
  source: string;
  notes?: string;
  addedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LeadCreationAttributes
  extends Optional<
    LeadAttributes,
    | "id" | "title" | "linkedinUrl" | "campaignId" | "aiDraft" | "source" | "notes" | "addedAt"
    | "phone" | "seniority" | "department" | "industry" | "employeeCount" | "location"
    | "website" | "companyLinkedinUrl" | "emailStatus" | "emailConfidence" | "keywords" | "apolloContactId"
    | "technologies" | "annualRevenue" | "raw" | "enrichment" | "draftSubject" | "draftApproved"
  > {}

export class Lead extends Model<LeadAttributes, LeadCreationAttributes> implements LeadAttributes {
  declare id: string;
  declare name: string;
  declare company: string;
  declare title: string;
  declare email: string;
  declare linkedinUrl: string;
  declare phone: string;
  declare seniority: string;
  declare department: string;
  declare industry: string;
  declare employeeCount: number | null;
  declare location: string;
  declare website: string;
  declare companyLinkedinUrl: string;
  declare emailStatus: string;
  declare emailConfidence: string;
  declare keywords: string;
  declare technologies: string;
  declare annualRevenue: string;
  declare apolloContactId: string;
  declare raw: Record<string, any> | null;
  declare enrichment: Record<string, any> | null;
  declare draftSubject: string;
  declare draftApproved: boolean;
  declare status: LeadStatus;
  declare campaignId: string | null;
  declare aiDraft: string;
  declare source: string;
  declare notes: string;
  declare addedAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Lead.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    company: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    linkedinUrl: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    seniority: { type: DataTypes.STRING, allowNull: true },
    department: { type: DataTypes.STRING, allowNull: true },
    industry: { type: DataTypes.STRING, allowNull: true },
    employeeCount: { type: DataTypes.INTEGER, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: true },
    website: { type: DataTypes.STRING, allowNull: true },
    companyLinkedinUrl: { type: DataTypes.STRING, allowNull: true },
    emailStatus: { type: DataTypes.STRING, allowNull: true },
    emailConfidence: { type: DataTypes.STRING, allowNull: true },
    keywords: { type: DataTypes.TEXT, allowNull: true },
    technologies: { type: DataTypes.TEXT, allowNull: true },
    annualRevenue: { type: DataTypes.STRING, allowNull: true },
    apolloContactId: { type: DataTypes.STRING, allowNull: true },
    raw: { type: DataTypes.JSONB, allowNull: true },
    enrichment: { type: DataTypes.JSONB, allowNull: true },
    draftSubject: { type: DataTypes.STRING, allowNull: true },
    draftApproved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: {
      type: DataTypes.ENUM("New", "Enriched", "Enrolled", "Emailed", "Replied", "Bounced", "Unsubscribed", "Interested"),
      defaultValue: "New",
      allowNull: false,
    },
    campaignId: { type: DataTypes.UUID, allowNull: true },
    aiDraft: { type: DataTypes.TEXT, allowNull: true },
    source: { type: DataTypes.STRING, defaultValue: "Manual", allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    addedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
  },
  { sequelize, tableName: "leads", timestamps: true }
);
