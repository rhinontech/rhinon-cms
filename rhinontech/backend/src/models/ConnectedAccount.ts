import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * A person's own mailbox, connected in Settings → Accounts (ported from
 * Saleszium). Used to send ticket replies from that person's Gmail or Outlook
 * instead of the brand address. One per person per provider.
 *
 * Tokens are encrypted at rest (services/totp.ts → encryptSecret) and never
 * leave the server.
 */
export type AccountProvider = "GOOGLE" | "MICROSOFT";

interface ConnectedAccountAttributes {
  id: string;
  userId: string;
  provider: AccountProvider;
  email: string;
  name?: string | null;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope?: string | null;
  /** Today's sends through this mailbox (UTC day in `sentOn`), shown against the provider's daily cap. */
  sentOn?: string | null;
  sentCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ConnectedAccountCreationAttributes extends Optional<ConnectedAccountAttributes, "id" | "name" | "scope" | "sentOn" | "sentCount"> {}

export class ConnectedAccount
  extends Model<ConnectedAccountAttributes, ConnectedAccountCreationAttributes>
  implements ConnectedAccountAttributes
{
  declare id: string;
  declare userId: string;
  declare provider: AccountProvider;
  declare email: string;
  declare name: string | null;
  declare accessToken: string;
  declare refreshToken: string;
  declare expiresAt: Date;
  declare scope: string | null;
  declare sentOn: string | null;
  declare sentCount: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ConnectedAccount.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    provider: { type: DataTypes.ENUM("GOOGLE", "MICROSOFT"), allowNull: false },
    email: { type: DataTypes.STRING(254), allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: true },
    accessToken: { type: DataTypes.TEXT, allowNull: false },
    refreshToken: { type: DataTypes.TEXT, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    scope: { type: DataTypes.TEXT, allowNull: true },
    sentOn: { type: DataTypes.DATEONLY, allowNull: true },
    sentCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, tableName: "connected_accounts", timestamps: true, indexes: [{ unique: true, fields: ["userId", "provider"] }] }
);
