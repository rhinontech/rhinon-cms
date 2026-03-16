import mongoose, { Schema, Document } from "mongoose";

export interface ISocialPost extends Document {
  name?: string;
  title: string;
  content: string;
  channel: "LinkedIn Post" | "LinkedIn Video" | "LinkedIn Article";
  status: "Draft" | "Scheduled" | "Published" | "Failed";
  scheduledDate?: Date;
  mediaUrl?: string;
  mediaTitle?: string;
  mediaDescription?: string;
  articleUrl?: string;
  slug?: string;
  visibility: "PUBLIC" | "CONNECTIONS";
  aiInstructions?: string;
  platformPostId?: string;
  socialStats?: {
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SocialPostSchema: Schema = new Schema(
  {
    name: { type: String },
    title: { type: String, required: true },
    content: { type: String, required: true },
    channel: { 
      type: String, 
      enum: ["LinkedIn Post", "LinkedIn Video", "LinkedIn Article"],
      required: true 
    },
    status: { 
      type: String, 
      enum: ["Draft", "Scheduled", "Published", "Failed"],
      default: "Draft" 
    },
    scheduledDate: { type: Date },
    mediaUrl: { type: String },
    mediaTitle: { type: String },
    mediaDescription: { type: String },
    articleUrl: { type: String },
    slug: { type: String, sparse: true },
    visibility: { 
      type: String, 
      enum: ["PUBLIC", "CONNECTIONS"],
      default: "PUBLIC" 
    },
    aiInstructions: { type: String },
    platformPostId: { type: String },
    socialStats: {
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 }
    },
  },
  { timestamps: true, collection: 'socialposts' }
);

// Ensure the model is only compiled once
export default mongoose.models.SocialPost || mongoose.model<ISocialPost>("SocialPost", SocialPostSchema);
