import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  roleId: string;
  avatarUrl?: string;
  status: "Active" | "Invited" | "Suspended";
  joinedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  roleId: { type: String, required: true },
  avatarUrl: { type: String },
  status: { type: String, enum: ["Active", "Invited", "Suspended"], default: "Active" },
  joinedAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
