import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * A publishing brand inside an organization.
 *
 * Replaces `Blog.domain`, which was a fixed enum of "rhinonlabs" | "uppercurve".
 * Those are two brands of ONE organization, so they were never the same thing as
 * a tenant — collapsing them into organizationId would have forced Rhinon to
 * split its own team across two workspaces, and leaving the enum would have put
 * Rhinon's brand names in every customer's Content module.
 *
 * A new workspace is seeded with exactly one site, so a tenant writing a blog
 * never sees a brand picker at all.
 */
interface SiteAttributes {
  id: string;
  name: string;
  /** URL-safe key. Doubles as the legacy `domain` value for rhinonlabs/uppercurve. */
  slug: string;
  /** Public site origin, used for canonical URLs and previews. */
  siteUrl: string | null;
  /**
   * The domain this brand's outbound mail is sent from, e.g. uppercurve.in.
   *
   * Null means "use the workspace's platform domain" — which is what every
   * brand did before, and what Rhinon Labs still does. A value here only works
   * once the domain is a verified SES identity with DKIM published; until then
   * mailer.ts refuses to rewrite onto it, because sending from an
   * unauthenticated domain lands in spam rather than failing loudly.
   */
  sendingDomain: string | null;
  /** The site content lands on when none is specified. Exactly one per org. */
  isDefault: boolean;
  /**
   * Which content types this site runs. Rhinon Labs has blogs + case studies,
   * Uppercurve has blogs + events; a tenant's single site gets all three.
   */
  supportsEvents: boolean;
  supportsCaseStudies: boolean;
  settings: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SiteCreationAttributes
  extends Optional<
    SiteAttributes,
    "id" | "siteUrl" | "sendingDomain" | "isDefault" | "supportsEvents" | "supportsCaseStudies" | "settings"
  > {}

export class Site
  extends Model<SiteAttributes, SiteCreationAttributes>
  implements SiteAttributes
{
  declare id: string;
  declare name: string;
  declare slug: string;
  declare siteUrl: string | null;
  declare sendingDomain: string | null;
  declare isDefault: boolean;
  declare supportsEvents: boolean;
  declare supportsCaseStudies: boolean;
  declare settings: Record<string, unknown>;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Site.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false },
    siteUrl: { type: DataTypes.STRING, allowNull: true },
    sendingDomain: { type: DataTypes.STRING, allowNull: true },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    supportsEvents: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    supportsCaseStudies: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    settings: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  },
  {
    sequelize,
    tableName: "sites",
    timestamps: true,
    // Slugs only have to be unique inside a workspace: two tenants may both
    // call their site "blog".
    indexes: [{ unique: true, fields: ["organizationId", "slug"] }],
  }
);
