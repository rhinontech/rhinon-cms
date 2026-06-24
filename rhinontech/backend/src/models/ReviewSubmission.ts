import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface ReviewSubmissionAttributes {
  id: string;
  cycleId: string;
  revieweeId: string;
  reviewerId: string;
  type: "self" | "manager";
  selfRating: number | null;
  managerRating: number | null;
  selfFeedback: string | null;
  managerFeedback: string | null;
  strengths: string | null;
  improvements: string | null;
  status: "pending" | "submitted";
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReviewSubmissionCreationAttributes
  extends Optional<
    ReviewSubmissionAttributes,
    | "id"
    | "status"
    | "selfRating"
    | "managerRating"
    | "selfFeedback"
    | "managerFeedback"
    | "strengths"
    | "improvements"
  > {}

export class ReviewSubmission
  extends Model<ReviewSubmissionAttributes, ReviewSubmissionCreationAttributes>
  implements ReviewSubmissionAttributes
{
  declare id: string;
  declare cycleId: string;
  declare revieweeId: string;
  declare reviewerId: string;
  declare type: "self" | "manager";
  declare selfRating: number | null;
  declare managerRating: number | null;
  declare selfFeedback: string | null;
  declare managerFeedback: string | null;
  declare strengths: string | null;
  declare improvements: string | null;
  declare status: "pending" | "submitted";
  declare createdAt: Date;
  declare updatedAt: Date;
}

ReviewSubmission.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    cycleId: { type: DataTypes.UUID, allowNull: false },
    revieweeId: { type: DataTypes.UUID, allowNull: false },
    reviewerId: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.ENUM("self", "manager"), allowNull: false },
    selfRating: { type: DataTypes.INTEGER, allowNull: true },
    managerRating: { type: DataTypes.INTEGER, allowNull: true },
    selfFeedback: { type: DataTypes.TEXT, allowNull: true },
    managerFeedback: { type: DataTypes.TEXT, allowNull: true },
    strengths: { type: DataTypes.TEXT, allowNull: true },
    improvements: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM("pending", "submitted"), defaultValue: "pending" },
  },
  {
    sequelize,
    tableName: "review_submissions",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["cycleId", "revieweeId", "type"] },
    ],
  }
);
