import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type OrganizationStatus = "active" | "trial" | "suspended";
export type OrganizationPlan = "free" | "starter" | "enterprise";

/** SES identity state for the org's email subdomain. */
export type SesStatus = "inherited" | "pending" | "verified" | "failed";

export interface OrganizationSettings {
  /** Display name used in outbound email + letters. Falls back to `name`. */
  displayName?: string;
  /** Registered legal entity, printed on offer letters / NDAs. */
  legalName?: string;
  logoUrl?: string | null;
  address?: string | null;
  supportEmail?: string | null;
  primaryColor?: string | null;
  /**
   * What the workspace sells and to whom — the brief the AI sales agent writes
   * from. Without it the agent has nothing true to say about a tenant and is
   * told so, rather than borrowing the platform's own pitch.
   */
  companyKnowledge?: string | null;
  /**
   * Set at signup, cleared when the owner clicks the link we email them. While
   * true the workspace cannot send outreach or automation mail: every tenant is
   * DKIM-signed by the platform domain, so an unverified throwaway signup
   * blasting mail would spend everyone's sender reputation.
   */
  pendingEmailVerification?: boolean;
}

interface OrganizationAttributes {
  id: string;
  name: string;
  slug: string;
  /** Always `<slug>.<PLATFORM_EMAIL_DOMAIN>` — e.g. swiggy.rhinontech.in */
  emailDomain: string;
  /** Reserved for the customer's own domain in a later phase. */
  customDomain: string | null;
  status: OrganizationStatus;
  plan: OrganizationPlan;
  /** Public headless-CMS key. Stored hashed; `apiKeyPrefix` is the visible half. */
  apiKeyHash: string | null;
  apiKeyPrefix: string | null;
  apiKeyRotatedAt: Date | null;
  /**
   * Rhinon Tech itself. Platform-operations modules (/deploy, /startup-ideas,
   * marketing analytics) are refused to every other org — a customer's
   * superadmin must never reach the machinery that runs the platform.
   */
  isPlatform: boolean;
  sesStatus: SesStatus;
  sesIdentityArn: string | null;
  sesVerifiedAt: Date | null;
  settings: OrganizationSettings;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrganizationCreationAttributes
  extends Optional<
    OrganizationAttributes,
    | "id" | "customDomain" | "status" | "plan"
    | "apiKeyHash" | "apiKeyPrefix" | "apiKeyRotatedAt"
    | "isPlatform" | "sesStatus" | "sesIdentityArn" | "sesVerifiedAt" | "settings"
  > {}

export class Organization
  extends Model<OrganizationAttributes, OrganizationCreationAttributes>
  implements OrganizationAttributes
{
  declare id: string;
  declare name: string;
  declare slug: string;
  declare emailDomain: string;
  declare customDomain: string | null;
  declare status: OrganizationStatus;
  declare plan: OrganizationPlan;
  declare apiKeyHash: string | null;
  declare apiKeyPrefix: string | null;
  declare apiKeyRotatedAt: Date | null;
  declare isPlatform: boolean;
  declare sesStatus: SesStatus;
  declare sesIdentityArn: string | null;
  declare sesVerifiedAt: Date | null;
  declare settings: OrganizationSettings;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Organization.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    emailDomain: { type: DataTypes.STRING, allowNull: false, unique: true },
    customDomain: { type: DataTypes.STRING, allowNull: true, unique: true },
    status: {
      type: DataTypes.ENUM("active", "trial", "suspended"),
      allowNull: false,
      defaultValue: "trial",
    },
    plan: {
      type: DataTypes.ENUM("free", "starter", "enterprise"),
      allowNull: false,
      defaultValue: "free",
    },
    apiKeyHash: { type: DataTypes.STRING, allowNull: true },
    apiKeyPrefix: { type: DataTypes.STRING, allowNull: true },
    apiKeyRotatedAt: { type: DataTypes.DATE, allowNull: true },
    isPlatform: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sesStatus: {
      type: DataTypes.ENUM("inherited", "pending", "verified", "failed"),
      allowNull: false,
      defaultValue: "inherited",
    },
    sesIdentityArn: { type: DataTypes.STRING, allowNull: true },
    sesVerifiedAt: { type: DataTypes.DATE, allowNull: true },
    settings: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  },
  {
    sequelize,
    tableName: "organizations",
    timestamps: true,
    indexes: [{ fields: ["slug"] }, { fields: ["emailDomain"] }],
  }
);
