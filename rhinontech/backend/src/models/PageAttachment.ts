import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface PageAttachmentAttributes {
  id: string;
  pageId: string;
  name: string;
  key: string;
  mimeType: string;
  size: number;
  uploadedById: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PageAttachmentCreationAttributes extends Optional<PageAttachmentAttributes, "id"> {}

export class PageAttachment
  extends Model<PageAttachmentAttributes, PageAttachmentCreationAttributes>
  implements PageAttachmentAttributes
{
  declare id: string;
  declare pageId: string;
  declare name: string;
  declare key: string;
  declare mimeType: string;
  declare size: number;
  declare uploadedById: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PageAttachment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    pageId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    key: { type: DataTypes.STRING, allowNull: false },
    mimeType: { type: DataTypes.STRING, allowNull: false },
    size: { type: DataTypes.INTEGER, allowNull: false },
    uploadedById: { type: DataTypes.UUID, allowNull: false },
  },
  { sequelize, tableName: "page_attachments", timestamps: true }
);
