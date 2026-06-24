import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type LeaveStatus = "Pending" | "Approved" | "Rejected";

interface LeaveRequestAttributes {
  id: string;
  userId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  processedById?: string;
  managerNote?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LeaveRequestCreationAttributes
  extends Optional<LeaveRequestAttributes, "id" | "status" | "processedById" | "managerNote"> {}

export class LeaveRequest
  extends Model<LeaveRequestAttributes, LeaveRequestCreationAttributes>
  implements LeaveRequestAttributes
{
  declare id: string;
  declare userId: string;
  declare leaveTypeId: string;
  declare startDate: string;
  declare endDate: string;
  declare days: number;
  declare reason: string;
  declare status: LeaveStatus;
  declare processedById?: string;
  declare managerNote?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

LeaveRequest.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    leaveTypeId: { type: DataTypes.UUID, allowNull: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    days: { type: DataTypes.FLOAT, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
      defaultValue: "Pending",
    },
    processedById: { type: DataTypes.UUID, allowNull: true },
    managerNote: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: "leave_requests",
    timestamps: true,
  }
);
