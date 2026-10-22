import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * One row per workspace, per metered thing, per (IST) day.
 *
 * Written only through services/usage.ts, which increments with a single atomic
 * INSERT … ON CONFLICT so two concurrent sends cannot both squeeze under the
 * limit. Read through the ORM for the usage summary.
 */
interface UsageCounterAttributes {
  id: string;
  kind: string;
  day: string;
  count: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UsageCounterCreationAttributes extends Optional<UsageCounterAttributes, "id" | "count"> {}

export class UsageCounter
  extends Model<UsageCounterAttributes, UsageCounterCreationAttributes>
  implements UsageCounterAttributes
{
  declare id: string;
  declare kind: string;
  declare day: string;
  declare count: number;
}

UsageCounter.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    kind: { type: DataTypes.STRING(32), allowNull: false },
    day: { type: DataTypes.DATEONLY, allowNull: false },
    count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: "usage_counters",
    timestamps: true,
    // organizationId is added to every tenant model at runtime (tenantScope.ts),
    // so the uniqueness it belongs to is declared by name here.
    indexes: [{ unique: true, fields: ["organizationId", "kind", "day"], name: "usage_counters_org_kind_day" }],
  }
);
