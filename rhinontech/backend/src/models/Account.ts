import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * A company record. `Lead.company` was free text, so two contacts at the same
 * employer were unrelated rows. Accounts give that a home: `domain` is the
 * dedupe key (normalized host, no protocol/www), unique where present.
 */
interface AccountAttributes {
  id: string;
  name: string;
  domain?: string | null;
  website?: string | null;
  industry?: string | null;
  employeeCount?: number | null;
  annualRevenue?: string | null;
  location?: string | null;
  linkedinUrl?: string | null;
  phone?: string | null;
  description?: string | null;
  ownerId?: string | null;
  createdById?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AccountCreationAttributes
  extends Optional<
    AccountAttributes,
    | "id" | "domain" | "website" | "industry" | "employeeCount" | "annualRevenue"
    | "location" | "linkedinUrl" | "phone" | "description" | "ownerId" | "createdById"
  > {}

export class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
  declare id: string;
  declare name: string;
  declare domain: string | null;
  declare website: string | null;
  declare industry: string | null;
  declare employeeCount: number | null;
  declare annualRevenue: string | null;
  declare location: string | null;
  declare linkedinUrl: string | null;
  declare phone: string | null;
  declare description: string | null;
  declare ownerId: string | null;
  declare createdById: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/** Strips protocol, www., path and port so "https://www.Acme.com/x" -> "acme.com". */
export function normalizeDomain(input?: string | null): string | null {
  const raw = (input ?? "").toString().trim().toLowerCase();
  if (!raw) return null;
  const host = raw
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split(":")[0];
  // Reject anything that isn't plausibly a hostname (e.g. a bare company name).
  if (!host || !host.includes(".") || /\s/.test(host)) return null;
  return host;
}

/** Free email hosts must never collapse distinct companies into one account. */
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in", "hotmail.com", "outlook.com",
  "live.com", "aol.com", "icloud.com", "me.com", "proton.me", "protonmail.com",
  "zoho.com", "yandex.com", "mail.com", "gmx.com", "rediffmail.com",
]);

export function domainFromEmail(email?: string | null): string | null {
  const at = (email ?? "").lastIndexOf("@");
  if (at < 0) return null;
  const host = normalizeDomain(email!.slice(at + 1));
  if (!host || FREE_EMAIL_DOMAINS.has(host)) return null;
  return host;
}

Account.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    domain: { type: DataTypes.STRING, allowNull: true, unique: true },
    website: { type: DataTypes.STRING, allowNull: true },
    industry: { type: DataTypes.STRING, allowNull: true },
    employeeCount: { type: DataTypes.INTEGER, allowNull: true },
    annualRevenue: { type: DataTypes.STRING, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: true },
    linkedinUrl: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    ownerId: { type: DataTypes.UUID, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { sequelize, tableName: "accounts", timestamps: true }
);
