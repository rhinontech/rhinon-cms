import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type PayslipStatus = "draft" | "paid";

interface PayslipAttributes {
  id: string;
  payrollId: string;
  userId: string;
  // Earnings
  basicSalary: number;
  hra: number;
  ta: number;
  medicalAllowance: number;
  otherAllowances: number;
  grossPay: number;
  // Deductions
  pfEmployee: number;
  pfEmployer: number;
  tds: number;
  professionalTax: number;
  otherDeductions: number;
  totalDeductions: number;
  // Net
  netPay: number;
  paymentDate?: Date;
  status: PayslipStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PayslipCreationAttributes
  extends Optional<
    PayslipAttributes,
    "id" | "hra" | "ta" | "medicalAllowance" | "otherAllowances" | "pfEmployer" | "tds" | "professionalTax" | "otherDeductions" | "status"
  > {}

export class Payslip
  extends Model<PayslipAttributes, PayslipCreationAttributes>
  implements PayslipAttributes
{
  declare id: string;
  declare payrollId: string;
  declare userId: string;
  declare basicSalary: number;
  declare hra: number;
  declare ta: number;
  declare medicalAllowance: number;
  declare otherAllowances: number;
  declare grossPay: number;
  declare pfEmployee: number;
  declare pfEmployer: number;
  declare tds: number;
  declare professionalTax: number;
  declare otherDeductions: number;
  declare totalDeductions: number;
  declare netPay: number;
  declare paymentDate?: Date;
  declare status: PayslipStatus;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Payslip.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    payrollId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    basicSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    hra: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    ta: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    medicalAllowance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    otherAllowances: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    grossPay: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    pfEmployee: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    pfEmployer: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    tds: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    professionalTax: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    otherDeductions: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    totalDeductions: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    netPay: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    paymentDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.ENUM("draft", "paid"), defaultValue: "draft" },
  },
  { sequelize, tableName: "payslips", timestamps: true }
);
