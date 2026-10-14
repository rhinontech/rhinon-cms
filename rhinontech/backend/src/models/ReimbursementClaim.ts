import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

// pending → approved → paid, or pending → rejected.
// An approved "payslip" claim rides on the employee's next draft payslip and turns
// paid when that payslip is paid; a "direct" claim was settled outside payroll
// (e.g. past months already paid by hand) and never appears on a payslip.
export type ClaimStatus = "pending" | "approved" | "rejected" | "paid";
export type ClaimPayout = "payslip" | "direct";
export const CLAIM_CATEGORIES = ["Internet", "Phone", "Travel", "Equipment", "Other"] as const;

interface ReimbursementClaimAttributes {
  id: string;
  userId: string;
  category: string;
  description: string;
  // Month the expense was incurred in (not the month it gets paid)
  expenseMonth: number;
  expenseYear: number;
  amount: number;
  receiptKey?: string | null;
  receiptName?: string | null;
  status: ClaimStatus;
  payout?: ClaimPayout | null;
  payslipId?: string | null;
  reviewedById?: string | null;
  reviewedAt?: Date | null;
  reviewNote?: string | null;
  paidAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReimbursementClaimCreationAttributes
  extends Optional<
    ReimbursementClaimAttributes,
    "id" | "receiptKey" | "receiptName" | "status" | "payout" | "payslipId" | "reviewedById" | "reviewedAt" | "reviewNote" | "paidAt"
  > {}

export class ReimbursementClaim
  extends Model<ReimbursementClaimAttributes, ReimbursementClaimCreationAttributes>
  implements ReimbursementClaimAttributes
{
  declare id: string;
  declare userId: string;
  declare category: string;
  declare description: string;
  declare expenseMonth: number;
  declare expenseYear: number;
  declare amount: number;
  declare receiptKey: string | null;
  declare receiptName: string | null;
  declare status: ClaimStatus;
  declare payout: ClaimPayout | null;
  declare payslipId: string | null;
  declare reviewedById: string | null;
  declare reviewedAt: Date | null;
  declare reviewNote: string | null;
  declare paidAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ReimbursementClaim.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: false },
    expenseMonth: { type: DataTypes.INTEGER, allowNull: false },
    expenseYear: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    receiptKey: { type: DataTypes.STRING, allowNull: true },
    receiptName: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.ENUM("pending", "approved", "rejected", "paid"), allowNull: false, defaultValue: "pending" },
    payout: { type: DataTypes.ENUM("payslip", "direct"), allowNull: true },
    payslipId: { type: DataTypes.UUID, allowNull: true },
    reviewedById: { type: DataTypes.UUID, allowNull: true },
    reviewedAt: { type: DataTypes.DATE, allowNull: true },
    reviewNote: { type: DataTypes.STRING(1000), allowNull: true },
    paidAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: "reimbursement_claims", timestamps: true }
);
