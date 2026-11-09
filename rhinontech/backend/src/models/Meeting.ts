import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface MeetingAttributes {
  id: string;
  summary: string;
  description?: string | null;
  location?: string | null;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  meetLink?: string | null;
  sequence: number;
  status: "confirmed" | "cancelled";
  organizerEmail?: string | null;
  createdById?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MeetingCreationAttributes
  extends Optional<MeetingAttributes, "id" | "description" | "location" | "attendees" | "meetLink" | "sequence" | "status" | "organizerEmail" | "createdById"> {}

/**
 * A meeting on Rhinon's built-in calendar — the default when nobody has connected
 * Google or Microsoft (services/nativeCalendar.ts). Shared across the workspace,
 * like the workspace Google calendar it stands in for.
 */
export class Meeting extends Model<MeetingAttributes, MeetingCreationAttributes> implements MeetingAttributes {
  declare id: string;
  declare summary: string;
  declare description: string | null;
  declare location: string | null;
  declare startTime: Date;
  declare endTime: Date;
  declare attendees: string[];
  declare meetLink: string | null;
  declare sequence: number;
  declare status: "confirmed" | "cancelled";
  declare organizerEmail: string | null;
  declare createdById: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Meeting.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    summary: { type: DataTypes.STRING(300), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    location: { type: DataTypes.STRING(500), allowNull: true },
    startTime: { type: DataTypes.DATE, allowNull: false },
    endTime: { type: DataTypes.DATE, allowNull: false },
    attendees: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    meetLink: { type: DataTypes.STRING(500), allowNull: true },
    sequence: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "confirmed" },
    organizerEmail: { type: DataTypes.STRING(320), allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { sequelize, tableName: "meetings", timestamps: true, indexes: [{ fields: ["startTime"] }] }
);
