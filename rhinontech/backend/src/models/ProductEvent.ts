import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * One thing a person did in the product (signed up, invited someone, sent a
 * campaign…), for activation and retention numbers. First-party on purpose:
 * the privacy policy promises no third-party trackers, and this answers "who
 * activated?" without one. Written only through services/productEvents.ts.
 */
interface ProductEventAttributes {
  id: string;
  userId: string | null;
  event: string;
  props: Record<string, unknown> | null;
  createdAt?: Date;
}

interface ProductEventCreationAttributes extends Optional<ProductEventAttributes, "id" | "userId" | "props"> {}

export class ProductEvent extends Model<ProductEventAttributes, ProductEventCreationAttributes> implements ProductEventAttributes {
  declare id: string;
  declare userId: string | null;
  declare event: string;
  declare props: Record<string, unknown> | null;
  declare readonly createdAt: Date;
}

ProductEvent.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true },
    event: { type: DataTypes.STRING(64), allowNull: false },
    props: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    sequelize,
    tableName: "product_events",
    timestamps: true,
    updatedAt: false,
    // organizationId is added at runtime by tenantScope.ts.
    indexes: [{ fields: ["organizationId", "event", "createdAt"], name: "product_events_org_event_time" }],
  }
);
