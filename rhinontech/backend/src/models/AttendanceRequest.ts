import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database";

export class AttendanceRequest extends Model {
  public id!: string;
  public userId!: string;
  public type!: "Regularization" | "Overtime" | "Shift Change";
  public date!: string;
  public reason!: string;
  public status!: "Pending" | "Approved" | "Rejected";
  public requestedTime!: string; // e.g. "09:30 AM" or "2 Hours"
  public processedById!: string | null;
}

AttendanceRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("Regularization", "Overtime", "Shift Change"),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
      defaultValue: "Pending",
    },
    requestedTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    processedById: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "attendance_requests",
  }
);
