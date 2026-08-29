import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

// Channel = the high-level traffic source we derive server-side from the referrer + UTM params.
export type TrafficChannel = "Organic Search" | "Direct" | "Social" | "Referral";

interface PageViewAttributes {
  id: string;
  // Anonymous first-party ids generated on the marketing site (no PII, no cross-site cookies).
  visitorId: string; // stable per browser (localStorage) — used for unique-visitor counts
  sessionId: string; // per browsing session (sessionStorage)
  path: string; // e.g. "/blogs/my-post" (no querystring)
  title?: string | null; // document.title at view time (nice labels in "top pages")
  referrer?: string | null; // full document.referrer
  referrerHost?: string | null; // parsed host of the referrer, for grouping
  channel: TrafficChannel;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  userAgent?: string | null; // kept for bot filtering + future device/browser views
  isBot: boolean;
  companyName?: string | null;
  companyDomain?: string | null; // excluded from all dashboard counts so organic numbers stay honest
  // Coarse geo, resolved from the request IP at capture time and then the IP is discarded.
  // Null on rows recorded before geo capture existed — those cannot be backfilled.
  country?: string | null;
  region?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PageViewCreationAttributes
  extends Optional<
    PageViewAttributes,
    | "id" | "title" | "referrer" | "referrerHost" | "utmSource" | "utmMedium"
    | "utmCampaign" | "utmTerm" | "utmContent" | "userAgent" | "isBot"
    | "companyName" | "companyDomain"
    | "country" | "region" | "city" | "latitude" | "longitude"
  > {}

export class PageView extends Model<PageViewAttributes, PageViewCreationAttributes> implements PageViewAttributes {
  declare id: string;
  declare visitorId: string;
  declare sessionId: string;
  declare path: string;
  declare title: string | null;
  declare referrer: string | null;
  declare referrerHost: string | null;
  declare channel: TrafficChannel;
  declare utmSource: string | null;
  declare utmMedium: string | null;
  declare utmCampaign: string | null;
  declare utmTerm: string | null;
  declare utmContent: string | null;
  declare userAgent: string | null;
  declare isBot: boolean;
  declare companyName: string | null;
  declare companyDomain: string | null;
  declare country: string | null;
  declare region: string | null;
  declare city: string | null;
  declare latitude: number | null;
  declare longitude: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PageView.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    visitorId: { type: DataTypes.STRING, allowNull: false },
    sessionId: { type: DataTypes.STRING, allowNull: false },
    path: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: true },
    referrer: { type: DataTypes.TEXT, allowNull: true },
    referrerHost: { type: DataTypes.STRING, allowNull: true },
    channel: {
      type: DataTypes.ENUM("Organic Search", "Direct", "Social", "Referral"),
      allowNull: false,
      defaultValue: "Direct",
    },
    utmSource: { type: DataTypes.STRING, allowNull: true },
    utmMedium: { type: DataTypes.STRING, allowNull: true },
    utmCampaign: { type: DataTypes.STRING, allowNull: true },
    utmTerm: { type: DataTypes.STRING, allowNull: true },
    utmContent: { type: DataTypes.STRING, allowNull: true },
    userAgent: { type: DataTypes.TEXT, allowNull: true },
    // Derived from the request IP at ingest and then discarded — the raw address
    // is never stored, so the tracker stays cookieless and consent-free while
    // still yielding a company-level intent signal.
    companyName: { type: DataTypes.STRING, allowNull: true },
    companyDomain: { type: DataTypes.STRING, allowNull: true },
    country: { type: DataTypes.STRING, allowNull: true },
    region: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    latitude: { type: DataTypes.FLOAT, allowNull: true },
    longitude: { type: DataTypes.FLOAT, allowNull: true },
    isBot: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    sequelize,
    tableName: "page_views",
    timestamps: true,
    indexes: [
      { fields: ["createdAt"] },
      { fields: ["visitorId"] },
      { fields: ["channel"] },
    ],
  }
);
