import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface EventGuestAttributes {
  id: string;
  eventId: string;
  userId?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  linkedin?: string | null;
  referralCode?: string | null;
  /** This guest's own code to share — others registering with it count as their referrals. */
  ownReferralCode?: string | null;
  role?: string | null;
  graduationYear?: string | null;
  collegeName?: string | null;
  userType?: string | null;
  eventType?: string | null;
  guestType: "Waitlist" | "Approved" | "Declined";
  eventName?: string | null;
  feedbackData?: Record<string, any> | null;
  feedbackSubmittedAt?: Date | null;
  certificateGenerated?: boolean;
  certificateId?: string | null;
  certificateGeneratedAt?: Date | null;
  certificateName?: string | null;
  certificateApproved?: boolean;
  additionalData?: Record<string, any> | null;

  siteId?: string | null;
  organizationId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EventGuestCreationAttributes
  extends Optional<
    EventGuestAttributes,
    | "id"
    | "userId"
    | "phone"
    | "email"
    | "linkedin"
    | "referralCode"
    | "ownReferralCode"
    | "role"
    | "graduationYear"
    | "collegeName"
    | "userType"
    | "eventType"
    | "guestType"
    | "eventName"
    | "feedbackData"
    | "feedbackSubmittedAt"
    | "certificateGenerated"
    | "certificateId"
    | "certificateGeneratedAt"
    | "certificateName"
    | "certificateApproved"
    | "additionalData"
    | "siteId"
    | "organizationId"
  > {}

export class EventGuest
  extends Model<EventGuestAttributes, EventGuestCreationAttributes>
  implements EventGuestAttributes
{
  declare id: string;
  declare eventId: string;
  declare userId: string | null;
  declare name: string;
  declare phone: string | null;
  declare email: string | null;
  declare linkedin: string | null;
  declare referralCode: string | null;
  declare ownReferralCode?: string | null;
  declare role: string | null;
  declare graduationYear: string | null;
  declare collegeName: string | null;
  declare userType: string | null;
  declare eventType: string | null;
  declare guestType: "Waitlist" | "Approved" | "Declined";
  declare eventName: string | null;
  declare feedbackData: Record<string, any> | null;
  declare feedbackSubmittedAt: Date | null;
  declare certificateGenerated: boolean;
  declare certificateId: string | null;
  declare certificateGeneratedAt: Date | null;
  declare certificateName: string | null;
  declare certificateApproved: boolean;
  declare additionalData: Record<string, any> | null;

  declare siteId: string | null;
  declare organizationId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

EventGuest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkedin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    referralCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ownReferralCode: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    graduationYear: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    collegeName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    eventType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    guestType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Waitlist",
    },
    eventName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    feedbackData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    feedbackSubmittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    certificateGenerated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    certificateId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    certificateGeneratedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    certificateName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    certificateApproved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    additionalData: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    siteId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "event_guests",
    timestamps: true,
    indexes: [
      { fields: ["eventId"] },
      { fields: ["userId"] },
      { fields: ["guestType"] },
      { fields: ["eventId", "ownReferralCode"] },
    ],
  }
);
