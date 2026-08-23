import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

// One shared, company-wide Google Calendar connection (support@rhinon.tech) — not per-user.
// Client ID/Secret stay in env (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET, same convention as
// LinkedIn); only the tokens produced by the one-time consent live here, so the calendar can
// be reconnected from Settings without a redeploy.
interface GoogleCalendarTokenAttributes {
  id: string;
  refreshToken: string;
  accessToken?: string | null;
  expiresAt?: Date | null;
  connectedEmail?: string | null;
  calendarId: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GoogleCalendarTokenCreationAttributes
  extends Optional<
    GoogleCalendarTokenAttributes,
    "id" | "accessToken" | "expiresAt" | "connectedEmail" | "calendarId" | "isActive"
  > {}

export class GoogleCalendarToken
  extends Model<GoogleCalendarTokenAttributes, GoogleCalendarTokenCreationAttributes>
  implements GoogleCalendarTokenAttributes
{
  declare id: string;
  declare refreshToken: string;
  declare accessToken: string | null;
  declare expiresAt: Date | null;
  declare connectedEmail: string | null;
  declare calendarId: string;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

GoogleCalendarToken.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    refreshToken: { type: DataTypes.TEXT, allowNull: false },
    accessToken: { type: DataTypes.TEXT, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    connectedEmail: { type: DataTypes.STRING, allowNull: true },
    calendarId: { type: DataTypes.STRING, allowNull: false, defaultValue: "primary" },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: "google_calendar_tokens", timestamps: true }
);

// Reconnects deactivate the old row rather than deleting it (same as LinkedInToken), so the
// "current" connection is always the newest active one.
export async function getActiveCalendarToken(): Promise<GoogleCalendarToken | null> {
  return GoogleCalendarToken.findOne({ where: { isActive: true }, order: [["createdAt", "DESC"]] });
}
