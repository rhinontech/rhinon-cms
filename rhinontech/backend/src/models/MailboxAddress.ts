import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * An extra email address the superadmin hands to an employee — hello@,
 * support@, events@ — on top of their own company address.
 *
 * Only the local part is stored. The domain is the workspace's email domain,
 * and brandSender() moves it onto each brand's sending domain like any other
 * address, so "hello" is hello@rhinontech.in under Rhinon Labs and
 * hello@uppercurve.in under Uppercurve: one address, one owner, every brand.
 *
 * Mail belongs to the ADDRESS, not the person (InboxEmail.ownerEmail is the
 * address), so reassigning it hands the whole history to the new owner.
 */
export interface MailboxAddressAttributes {
  id: string;
  localPart: string;
  /** Shown as the sender name; falls back to the assignee's own name. */
  displayName: string | null;
  assignedUserId: string | null;
  organizationId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type Creation = Optional<MailboxAddressAttributes, "id" | "displayName" | "assignedUserId">;

export class MailboxAddress extends Model<MailboxAddressAttributes, Creation> implements MailboxAddressAttributes {
  declare id: string;
  declare localPart: string;
  declare displayName: string | null;
  declare assignedUserId: string | null;
  declare organizationId?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

MailboxAddress.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    localPart: { type: DataTypes.STRING(64), allowNull: false },
    displayName: { type: DataTypes.STRING(120), allowNull: true },
    assignedUserId: { type: DataTypes.UUID, allowNull: true },
    organizationId: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    tableName: "mailbox_addresses",
    timestamps: true,
    indexes: [{ unique: true, fields: ["organizationId", "localPart"] }],
  }
);
