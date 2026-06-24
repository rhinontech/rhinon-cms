import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type DocumentCategory =
  | "offer_letter"
  | "contract"
  | "id_proof"
  | "appraisal"
  | "nda"
  | "other";

interface DocumentAttributes {
  id: string;
  employeeId: string;
  uploadedById: string;
  title: string;
  category: DocumentCategory;
  fileKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  isRequest: boolean;
  requestNote: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DocumentCreationAttributes
  extends Optional<
    DocumentAttributes,
    "id" | "fileKey" | "fileName" | "fileSize" | "mimeType" | "isRequest" | "requestNote"
  > {}

export class Document
  extends Model<DocumentAttributes, DocumentCreationAttributes>
  implements DocumentAttributes
{
  declare id: string;
  declare employeeId: string;
  declare uploadedById: string;
  declare title: string;
  declare category: DocumentCategory;
  declare fileKey: string | null;
  declare fileName: string | null;
  declare fileSize: number | null;
  declare mimeType: string | null;
  declare isRequest: boolean;
  declare requestNote: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Document.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    employeeId: { type: DataTypes.UUID, allowNull: false },
    uploadedById: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    category: {
      type: DataTypes.ENUM("offer_letter", "contract", "id_proof", "appraisal", "nda", "other"),
      allowNull: false,
    },
    fileKey: { type: DataTypes.STRING, allowNull: true },
    fileName: { type: DataTypes.STRING, allowNull: true },
    fileSize: { type: DataTypes.INTEGER, allowNull: true },
    mimeType: { type: DataTypes.STRING, allowNull: true },
    isRequest: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    requestNote: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: "documents",
    timestamps: true,
  }
);
