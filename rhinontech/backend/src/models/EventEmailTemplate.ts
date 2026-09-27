import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export const EMAIL_TARGET_TYPES = ["All", "Approved", "Waitlist", "Declined"] as const;
export const EMAIL_TARGET_ROLES = ["All", "Professional", "Student"] as const;
export const EMAIL_TEMPLATE_STATUSES = ["draft", "scheduled", "sending", "sent", "failed"] as const;

export type EmailTargetType = (typeof EMAIL_TARGET_TYPES)[number];
export type EmailTargetRole = (typeof EMAIL_TARGET_ROLES)[number];
export type EmailTemplateStatus = (typeof EMAIL_TEMPLATE_STATUSES)[number];

export interface EventEmailTemplateAttributes {
  id: string;
  eventId: string;
  templateName: string;
  subject: string;
  body: string;
  targetGuestType: EmailTargetType;
  targetGuestRole: EmailTargetRole;
  isActive: boolean;
  scheduledAt: Date | null;
  sentAt: Date | null;
  status: EmailTemplateStatus;
  /**
   * Addresses this template has already reached. A send that fails part-way is
   * retried from here, so nobody gets the same reminder twice — Product Space's
   * scheduler re-sent to everyone on retry.
   */
  deliveredTo: string[];
  failedRecipients: string[];
  attempts: number;
  lastError: string | null;
  organizationId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type Creation = Optional<
  EventEmailTemplateAttributes,
  | "id"
  | "targetGuestType"
  | "targetGuestRole"
  | "isActive"
  | "scheduledAt"
  | "sentAt"
  | "status"
  | "deliveredTo"
  | "failedRecipients"
  | "attempts"
  | "lastError"
>;

/** A reminder / announcement email an admin writes for one event's guests. */
export class EventEmailTemplate
  extends Model<EventEmailTemplateAttributes, Creation>
  implements EventEmailTemplateAttributes
{
  declare id: string;
  declare eventId: string;
  declare templateName: string;
  declare subject: string;
  declare body: string;
  declare targetGuestType: EmailTargetType;
  declare targetGuestRole: EmailTargetRole;
  declare isActive: boolean;
  declare scheduledAt: Date | null;
  declare sentAt: Date | null;
  declare status: EmailTemplateStatus;
  declare deliveredTo: string[];
  declare failedRecipients: string[];
  declare attempts: number;
  declare lastError: string | null;
  declare organizationId?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

EventEmailTemplate.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    eventId: { type: DataTypes.UUID, allowNull: false },
    templateName: { type: DataTypes.STRING, allowNull: false },
    subject: { type: DataTypes.STRING(500), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    targetGuestType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "All",
      validate: { isIn: [EMAIL_TARGET_TYPES as unknown as string[]] },
    },
    targetGuestRole: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "All",
      validate: { isIn: [EMAIL_TARGET_ROLES as unknown as string[]] },
    },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    scheduledAt: { type: DataTypes.DATE, allowNull: true },
    sentAt: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "draft",
      validate: { isIn: [EMAIL_TEMPLATE_STATUSES as unknown as string[]] },
    },
    deliveredTo: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    failedRecipients: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastError: { type: DataTypes.TEXT, allowNull: true },
    organizationId: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    tableName: "event_email_templates",
    timestamps: true,
    indexes: [{ fields: ["eventId"] }, { fields: ["status", "scheduledAt"] }],
  }
);
