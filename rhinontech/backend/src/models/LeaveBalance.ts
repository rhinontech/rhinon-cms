import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface LeaveBalanceAttributes {
  id: string;
  userId: string;
  leaveTypeId: string;
  year: number;
  allocated: number;
  used: number;
}

interface LeaveBalanceCreationAttributes
  extends Optional<LeaveBalanceAttributes, "id" | "allocated" | "used"> {}

export class LeaveBalance
  extends Model<LeaveBalanceAttributes, LeaveBalanceCreationAttributes>
  implements LeaveBalanceAttributes
{
  declare id: string;
  declare userId: string;
  declare leaveTypeId: string;
  declare year: number;
  declare allocated: number;
  declare used: number;
}

LeaveBalance.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    leaveTypeId: { type: DataTypes.UUID, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    allocated: { type: DataTypes.FLOAT, defaultValue: 0 },
    used: { type: DataTypes.FLOAT, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: "leave_balances",
    timestamps: false,
    indexes: [{ unique: true, fields: ["userId", "leaveTypeId", "year"] }],
  }
);
