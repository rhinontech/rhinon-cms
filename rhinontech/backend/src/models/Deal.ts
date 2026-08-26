import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type DealStatus = "Open" | "Won" | "Lost";

/**
 * The money. Previously the app could not express "how much is this worth and
 * when does it close", so no pipeline value, forecast or win rate was derivable.
 *
 * `status` is denormalized from the stage's type on every stage change so that
 * reporting can filter without joining, and `closedAt` is stamped at the same
 * moment (see routes/deals.ts applyStageChange).
 */
interface DealAttributes {
  id: string;
  title: string;
  accountId?: string | null;
  primaryLeadId?: string | null;
  ownerId?: string | null;
  value: string | number;
  currency: string;
  stageId?: string | null;
  status: DealStatus;
  expectedCloseDate?: string | null;
  closedAt?: Date | null;
  lostReason?: string | null;
  source?: string | null;
  notes?: string | null;
  createdById?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DealCreationAttributes
  extends Optional<
    DealAttributes,
    | "id" | "accountId" | "primaryLeadId" | "ownerId" | "value" | "currency" | "stageId"
    | "status" | "expectedCloseDate" | "closedAt" | "lostReason" | "source" | "notes" | "createdById"
  > {}

export class Deal extends Model<DealAttributes, DealCreationAttributes> implements DealAttributes {
  declare id: string;
  declare title: string;
  declare accountId: string | null;
  declare primaryLeadId: string | null;
  declare ownerId: string | null;
  declare value: string | number;
  declare currency: string;
  declare stageId: string | null;
  declare status: DealStatus;
  declare expectedCloseDate: string | null;
  declare closedAt: Date | null;
  declare lostReason: string | null;
  declare source: string | null;
  declare notes: string | null;
  declare createdById: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Deal.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    accountId: { type: DataTypes.UUID, allowNull: true },
    primaryLeadId: { type: DataTypes.UUID, allowNull: true },
    ownerId: { type: DataTypes.UUID, allowNull: true },
    // DECIMAL keeps currency exact; Sequelize returns it as a string, which the
    // routes coerce with Number() before any arithmetic.
    value: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING, allowNull: false, defaultValue: "INR" },
    stageId: { type: DataTypes.UUID, allowNull: true },
    status: { type: DataTypes.ENUM("Open", "Won", "Lost"), allowNull: false, defaultValue: "Open" },
    expectedCloseDate: { type: DataTypes.DATEONLY, allowNull: true },
    closedAt: { type: DataTypes.DATE, allowNull: true },
    lostReason: { type: DataTypes.TEXT, allowNull: true },
    source: { type: DataTypes.STRING, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { sequelize, tableName: "deals", timestamps: true }
);
