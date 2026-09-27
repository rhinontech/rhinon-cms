import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * Which enrollment email a guest receives:
 *  - Pending    — joined the waitlist
 *  - Approved   — approved by an admin (carries a calendar invite)
 *  - Declined   — not approved
 *  - Registered — auto-approved Teardown/Hackathon sign-up (calendar invite),
 *                 with optional Student / Professional variants
 */
export const ENROLLMENT_EMAIL_TYPES = [
  "Pending",
  "Approved",
  "Declined",
  "Registered",
  "Registered_Student",
  "Registered_Professional",
] as const;
export type EnrollmentEmailType = (typeof ENROLLMENT_EMAIL_TYPES)[number];

/** Types that go out with a calendar invite, so they need a date and times. */
export const INVITE_EMAIL_TYPES: EnrollmentEmailType[] = [
  "Approved",
  "Registered",
  "Registered_Student",
  "Registered_Professional",
];

export interface EventEnrollmentEmailAttributes {
  id: string;
  eventId: string;
  type: EnrollmentEmailType;
  subject: string | null;
  body: string;
  /** Session the calendar invite is for — "YYYY-MM-DD", "HH:mm". */
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  organizationId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type Creation = Optional<EventEnrollmentEmailAttributes, "id" | "subject" | "date" | "startTime" | "endTime">;

/** Product Space's `EmailTemplate`: one per event per enrollment status. */
export class EventEnrollmentEmail
  extends Model<EventEnrollmentEmailAttributes, Creation>
  implements EventEnrollmentEmailAttributes
{
  declare id: string;
  declare eventId: string;
  declare type: EnrollmentEmailType;
  declare subject: string | null;
  declare body: string;
  declare date: string | null;
  declare startTime: string | null;
  declare endTime: string | null;
  declare organizationId?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

EventEnrollmentEmail.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    eventId: { type: DataTypes.UUID, allowNull: false },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [ENROLLMENT_EMAIL_TYPES as unknown as string[]] },
    },
    subject: { type: DataTypes.STRING(500), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: true },
    startTime: { type: DataTypes.STRING(5), allowNull: true },
    endTime: { type: DataTypes.STRING(5), allowNull: true },
    organizationId: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    tableName: "event_enrollment_emails",
    timestamps: true,
    indexes: [{ unique: true, fields: ["eventId", "type"] }],
  }
);
