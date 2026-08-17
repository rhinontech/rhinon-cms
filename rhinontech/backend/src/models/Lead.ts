import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type LeadStatus = "New" | "Enriched" | "Enrolled" | "Emailed" | "Replied" | "Bounced" | "Unsubscribed" | "Interested";

interface LeadAttributes {
  id: string;
  name: string;
  company: string;
  title?: string | null;
  email: string;
  linkedinUrl?: string | null;
  // Enrichment fields (e.g. populated from an Apollo CSV import)
  phone?: string | null;
  seniority?: string | null;
  department?: string | null;
  industry?: string | null;
  employeeCount?: number | null;
  location?: string | null;
  website?: string | null;
  companyLinkedinUrl?: string | null;
  emailStatus?: string | null;
  emailConfidence?: string | null;
  keywords?: string | null;
  technologies?: string | null;
  annualRevenue?: string | null;
  apolloContactId?: string | null;
  raw?: Record<string, any> | null;
  enrichment?: Record<string, any> | null;
  draftSubject?: string | null;
  draftApproved?: boolean;
  status: LeadStatus;
  campaignId?: string | null;
  aiDraft?: string | null;
  // Set by the tracking-pixel hit in the sent campaign email. Reset on each
  // fresh send (enroll / resend) so it always reflects the latest email out.
  emailOpened?: boolean;
  openedAt?: Date | null;
  source: string;
  notes?: string | null;
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
    | "emailOpened" | "openedAt"
  > {}

export class Lead extends Model<LeadAttributes, LeadCreationAttributes> implements LeadAttributes {
  declare id: string;
  declare name: string;
  declare company: string;
  declare title: string | null;
  declare email: string;
  declare linkedinUrl: string | null;
  declare phone: string | null;
  declare seniority: string | null;
  declare department: string | null;
  declare industry: string | null;
  declare employeeCount: number | null;
  declare location: string | null;
  declare website: string | null;
  declare companyLinkedinUrl: string | null;
  declare emailStatus: string | null;
  declare emailConfidence: string | null;
  declare keywords: string | null;
  declare technologies: string | null;
  declare annualRevenue: string | null;
  declare apolloContactId: string | null;
  declare raw: Record<string, any> | null;
  declare enrichment: Record<string, any> | null;
  declare draftSubject: string | null;
  declare draftApproved: boolean;
  declare status: LeadStatus;
  declare campaignId: string | null;
  declare aiDraft: string | null;
  declare emailOpened: boolean;
  declare openedAt: Date | null;
  declare source: string;
  declare notes: string | null;
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
    emailOpened: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    openedAt: { type: DataTypes.DATE, allowNull: true },
    source: { type: DataTypes.STRING, defaultValue: "Manual", allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    addedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
  },
  { sequelize, tableName: "leads", timestamps: true }
);
