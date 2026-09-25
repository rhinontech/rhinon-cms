import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type EventType = "Teardown" | "Hackathon" | "Workshop";
export type EventCategory =
  | "Community"
  | "Normal"
  | "MicroCertificate"
  | "GenAiMicroCertificate"
  | "Claude"
  | "ClaudeOneDay"
  | "InternalCohort";
export type CtaType = "Join Waitlist" | "Register Now";

export interface EventSpeaker {
  name: string;
  company: string;
  designation: string;
  photoUrl?: string;
}

export interface EventAttributes {
  id: string;
  eventTitle: string;
  eventSubtitle?: string | null;
  eventStartDate: string;
  eventEndDate: string;
  eventStartTime?: string | null;
  eventEndTime?: string | null;
  speakers?: EventSpeaker[] | null;
  numberOfAttendees?: number;
  eventCreativeUrl?: string | null;
  isPublished: boolean;
  eventType: EventType;
  eventCategory: EventCategory;
  ctaType: CtaType;
  location?: string | null;
  locationType?: string | null;
  tags: string[];
  eventDetails?: Record<string, any> | null;
  eventSlug: string;
  canAcceptResponse: boolean;

  // Legacy Blog-compatible fields for backward compatibility
  title?: string;
  slug?: string;
  status?: string;
  content?: string;
  excerpt?: string;

  siteId?: string | null;
  organizationId?: string | null;
  createdById?: string | null;
  /** Local part of the address event emails go out from (hello); the brand supplies the domain. */
  emailFromLocalPart?: string | null;
  emailFromName?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EventCreationAttributes
  extends Optional<
    EventAttributes,
    | "id"
    | "eventSubtitle"
    | "eventStartTime"
    | "eventEndTime"
    | "speakers"
    | "numberOfAttendees"
    | "eventCreativeUrl"
    | "isPublished"
    | "eventType"
    | "eventCategory"
    | "ctaType"
    | "location"
    | "locationType"
    | "tags"
    | "eventDetails"
    | "canAcceptResponse"
    | "title"
    | "slug"
    | "status"
    | "content"
    | "excerpt"
    | "siteId"
    | "organizationId"
    | "createdById"
    | "emailFromLocalPart"
    | "emailFromName"
  > {}

export class Event
  extends Model<EventAttributes, EventCreationAttributes>
  implements EventAttributes
{
  declare id: string;
  declare eventTitle: string;
  declare eventSubtitle: string | null;
  declare eventStartDate: string;
  declare eventEndDate: string;
  declare eventStartTime: string | null;
  declare eventEndTime: string | null;
  declare speakers: EventSpeaker[] | null;
  declare numberOfAttendees: number;
  declare eventCreativeUrl: string | null;
  declare isPublished: boolean;
  declare eventType: EventType;
  declare eventCategory: EventCategory;
  declare ctaType: CtaType;
  declare location: string | null;
  declare locationType: string | null;
  declare tags: string[];
  declare eventDetails: Record<string, any> | null;
  declare eventSlug: string;
  declare canAcceptResponse: boolean;

  // Legacy field support
  declare title: string;
  declare slug: string;
  declare status: string;
  declare content: string;
  declare excerpt: string;

  declare siteId: string | null;
  declare organizationId: string | null;
  declare createdById: string | null;
  declare emailFromLocalPart: string | null;
  declare emailFromName: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Event.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    eventTitle: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    eventSubtitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    eventStartDate: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    eventEndDate: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    eventStartTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    eventEndTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    speakers: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    numberOfAttendees: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    eventCreativeUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    eventType: {
      type: DataTypes.ENUM("Teardown", "Hackathon", "Workshop"),
      allowNull: true,
      defaultValue: "Workshop",
    },
    eventCategory: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "Normal",
    },
    ctaType: {
      type: DataTypes.ENUM("Join Waitlist", "Register Now"),
      allowNull: true,
      defaultValue: "Join Waitlist",
    },
    location: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    locationType: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    eventDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    eventSlug: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    canAcceptResponse: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    // Legacy fields stored for backward database compatibility
    title: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "Draft",
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "",
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "",
    },

    siteId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    emailFromLocalPart: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    emailFromName: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "events",
    timestamps: true,
    indexes: [{ fields: ["eventSlug"] }],
  }
);

Event.beforeValidate((event: any) => {
  if (event.eventTitle && !event.title) {
    event.title = event.eventTitle;
  }
  if (event.eventSlug && !event.slug) {
    event.slug = event.eventSlug;
  }
  if (!event.eventTitle && event.title) {
    event.eventTitle = event.title;
  }
  if (!event.eventSlug && event.slug) {
    event.eventSlug = event.slug;
  }
  if (event.isPublished !== undefined && !event.status) {
    event.status = event.isPublished ? "Published" : "Draft";
  }
});
