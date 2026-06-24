import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type PayrollStatus = "draft" | "processed" | "paid";

interface PayrollAttributes {
  id: string;
  month: number;
  year: number;
  status: PayrollStatus;
  totalGross: number;
  totalNet: number;
  processedById?: string;
  processedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PayrollCreationAttributes
  extends Optional<PayrollAttributes, "id" | "totalGross" | "totalNet" | "status"> {}

export class Payroll
  extends Model<PayrollAttributes, PayrollCreationAttributes>
  implements PayrollAttributes
{
  declare id: string;
  declare month: number;
  declare year: number;
  declare status: PayrollStatus;
  declare totalGross: number;
  declare totalNet: number;
  declare processedById?: string;
  declare processedAt?: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Payroll.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    month: { type: DataTypes.INTEGER, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM("draft", "processed", "paid"), defaultValue: "draft" },
    totalGross: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    totalNet: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    processedById: { type: DataTypes.UUID, allowNull: true },
    processedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: "payrolls", timestamps: true }
);
