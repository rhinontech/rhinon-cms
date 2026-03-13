import mongoose, { Schema, Document } from "mongoose";

export interface ILinkedInToken extends Document {
  organization_id?: string;
  user_id?: string; // We can link to a user if we have auth, for now keeping it simple
  access_token: string;
  refresh_token?: string;
  expires_at: Date;
  linkedin_user_id: string;
  linkedin_profile_data: any;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LinkedInTokenSchema = new Schema<ILinkedInToken>({
  organization_id: { type: String },
  user_id: { type: String },
  access_token: { type: String, required: true },
  refresh_token: { type: String },
  expires_at: { type: Date, required: true },
  linkedin_user_id: { type: String, required: true },
  linkedin_profile_data: { type: Schema.Types.Mixed },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.LinkedInToken || mongoose.model<ILinkedInToken>("LinkedInToken", LinkedInTokenSchema);
