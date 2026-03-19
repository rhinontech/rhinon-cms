import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  invitationToken?: string;
  linkedinUrl?: string;
  linkedinConnected?: boolean;
  isPrimaryAdmin?: boolean;
  roleId: string;
  password?: string;
  isTemporaryPassword?: boolean;
  mustChangePassword?: boolean;
  avatarUrl?: string;
  status: "Active" | "Invited" | "Suspended";
  joinedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  invitationToken: { type: String, sparse: true },
  linkedinUrl: { type: String },
  linkedinConnected: { type: Boolean, default: false },
  isPrimaryAdmin: { type: Boolean, default: false },
  roleId: { type: String, required: true },
  password: { type: String },
  isTemporaryPassword: { type: Boolean, default: false },
  mustChangePassword: { type: Boolean, default: false },
  avatarUrl: { type: String },
  status: { type: String, enum: ["Active", "Invited", "Suspended"], default: "Active" },
  joinedAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
