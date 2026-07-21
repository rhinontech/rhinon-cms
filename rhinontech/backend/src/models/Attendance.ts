import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type AttendanceStatus = "present" | "absent" | "weekend" | "holiday" | "leave";

export interface AttendanceBreak {
  start: string;
  end: string | null;
}

interface AttendanceAttributes {
  id: string;
  userId: string;
  date: Date;
  clockIn?: Date;
  clockOut?: Date;
  breaks?: AttendanceBreak[];
  status: AttendanceStatus;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AttendanceCreationAttributes
  extends Optional<AttendanceAttributes, "id" | "clockIn" | "clockOut" | "breaks" | "status" | "note"> {}

export class Attendance
  extends Model<AttendanceAttributes, AttendanceCreationAttributes>
  implements AttendanceAttributes
{
  declare id: string;
  declare userId: string;
  declare date: Date;
  declare clockIn?: Date;
  declare clockOut?: Date;
  declare breaks?: AttendanceBreak[];
  declare status: AttendanceStatus;
  declare note?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Attendance.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    clockIn: { type: DataTypes.DATE, allowNull: true },
    clockOut: { type: DataTypes.DATE, allowNull: true },
    breaks: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    status: {
      type: DataTypes.ENUM("present", "absent", "weekend", "holiday", "leave"),
      defaultValue: "absent",
    },
    note: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    tableName: "attendance",
    timestamps: true,
    indexes: [{ unique: true, fields: ["userId", "date"] }],
  }
);
