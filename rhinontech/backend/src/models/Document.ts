import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type DocumentCategory =
  | "offer_letter"
  | "contract"
  | "id_proof"
  | "appraisal"
  | "nda"
  | "other";

export type SignatureType = "typed" | "drawn";

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
  // E-signing — signingToken/signingTokenExpiry are shared across every document
  // in one signing session (e.g. offer_letter + nda created together for a new
  // hire), same pattern as User.onboardingToken/onboardingTokenExpiry.
  signingToken: string | null;
  signingTokenExpiry: Date | null;
  signedAt: Date | null;
  signatureType: SignatureType | null;
  signedName: string | null;
  signatureImageKey: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DocumentCreationAttributes
  extends Optional<
    DocumentAttributes,
    | "id" | "fileKey" | "fileName" | "fileSize" | "mimeType" | "isRequest" | "requestNote"
    | "signingToken" | "signingTokenExpiry" | "signedAt" | "signatureType" | "signedName" | "signatureImageKey"
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
  declare signingToken: string | null;
  declare signingTokenExpiry: Date | null;
  declare signedAt: Date | null;
  declare signatureType: SignatureType | null;
  declare signedName: string | null;
  declare signatureImageKey: string | null;
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
    signingToken: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    signingTokenExpiry: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    signedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    signatureType: { type: DataTypes.ENUM("typed", "drawn"), allowNull: true, defaultValue: null },
    signedName: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    signatureImageKey: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
  },
  {
    sequelize,
    tableName: "documents",
    timestamps: true,
  }
);
