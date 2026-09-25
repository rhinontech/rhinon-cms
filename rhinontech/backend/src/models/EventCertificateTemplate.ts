import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/** A text field placed on the certificate artwork, positioned in percent. */
export interface CertificateField {
  id: "name" | "date" | "certificateId";
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  alignment?: "left" | "center" | "right";
  fontWeight?: "normal" | "bold";
}

export interface EventCertificateTemplateAttributes {
  id: string;
  eventId: string;
  certificateName: string;
  imageSize: { width: number; height: number };
  fields: CertificateField[];
  /**
   * URL of the blank artwork. Product Space kept this as a base64 data URL in
   * the row; here it is an upload in the content bucket, so the row stays small.
   */
  templateImage: string;
  emailSubject: string | null;
  emailBody: string | null;
  organizationId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type Creation = Optional<EventCertificateTemplateAttributes, "id" | "emailSubject" | "emailBody">;

export class EventCertificateTemplate
  extends Model<EventCertificateTemplateAttributes, Creation>
  implements EventCertificateTemplateAttributes
{
  declare id: string;
  declare eventId: string;
  declare certificateName: string;
  declare imageSize: { width: number; height: number };
  declare fields: CertificateField[];
  declare templateImage: string;
  declare emailSubject: string | null;
  declare emailBody: string | null;
  declare organizationId?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

EventCertificateTemplate.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    eventId: { type: DataTypes.UUID, allowNull: false, unique: true },
    certificateName: { type: DataTypes.STRING, allowNull: false },
    imageSize: { type: DataTypes.JSONB, allowNull: false },
    fields: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    templateImage: { type: DataTypes.TEXT, allowNull: false },
    emailSubject: { type: DataTypes.STRING(500), allowNull: true },
    emailBody: { type: DataTypes.TEXT, allowNull: true },
    organizationId: { type: DataTypes.UUID, allowNull: true },
  },
  { sequelize, tableName: "event_certificate_templates", timestamps: true }
);
