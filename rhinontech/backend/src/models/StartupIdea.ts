import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

// Submissions from the rhinonlabs /build campaign page. Deliberately kept OUT of the
// `leads` table so a high-volume student campaign never pollutes the CRM pipeline —
// an idea only becomes a Lead when someone converts it from the admin panel.
export type StartupIdeaStatus =
  | "New"
  | "Reviewed"
  | "Contacted"
  | "Qualified"
  | "Converted"
  | "Dropped";

export const STARTUP_IDEA_STATUSES: StartupIdeaStatus[] = [
  "New",
  "Reviewed",
  "Contacted",
  "Qualified",
  "Converted",
  "Dropped",
];

interface StartupIdeaAttributes {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
  idea: string;
  stage?: string | null;
  budget?: string | null;
  status: StartupIdeaStatus;
  /** Cleared once someone opens the submission — drives the sidebar badge. */
  isRead: boolean;
  notes?: string | null;
  /** Which page/campaign it came from, e.g. "/build". */
  source?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  /** Set when the idea has been pushed into the CRM as a Lead. */
  convertedLeadId?: string | null;
  convertedAt?: Date | null;
  reviewedById?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StartupIdeaCreationAttributes
  extends Optional<
    StartupIdeaAttributes,
    | "id" | "phone" | "organization" | "stage" | "budget" | "status" | "isRead"
    | "notes" | "source" | "utmSource" | "utmMedium" | "utmCampaign" | "referrer"
    | "convertedLeadId" | "convertedAt" | "reviewedById" | "createdAt" | "updatedAt"
  > {}

export class StartupIdea
  extends Model<StartupIdeaAttributes, StartupIdeaCreationAttributes>
  implements StartupIdeaAttributes
{
  declare id: string;
  declare name: string;
  declare email: string;
  declare phone: string | null;
  declare organization: string | null;
  declare idea: string;
  declare stage: string | null;
  declare budget: string | null;
  declare status: StartupIdeaStatus;
  declare isRead: boolean;
  declare notes: string | null;
  declare source: string | null;
  declare utmSource: string | null;
  declare utmMedium: string | null;
  declare utmCampaign: string | null;
  declare referrer: string | null;
  declare convertedLeadId: string | null;
  declare convertedAt: Date | null;
  declare reviewedById: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

StartupIdea.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
    organization: { type: DataTypes.STRING, allowNull: true },
    idea: { type: DataTypes.TEXT, allowNull: false },
    stage: { type: DataTypes.STRING, allowNull: true },
    budget: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.ENUM(...STARTUP_IDEA_STATUSES),
      allowNull: false,
      defaultValue: "New",
    },
    isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    source: { type: DataTypes.STRING, allowNull: true, defaultValue: "/build" },
    utmSource: { type: DataTypes.STRING, allowNull: true },
    utmMedium: { type: DataTypes.STRING, allowNull: true },
    utmCampaign: { type: DataTypes.STRING, allowNull: true },
    referrer: { type: DataTypes.TEXT, allowNull: true },
    convertedLeadId: { type: DataTypes.UUID, allowNull: true },
    convertedAt: { type: DataTypes.DATE, allowNull: true },
    reviewedById: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    tableName: "startup_ideas",
    timestamps: true,
    indexes: [
      { fields: ["email"] },
      { fields: ["status"] },
      { fields: ["isRead"] },
      { fields: ["createdAt"] },
    ],
  }
);
