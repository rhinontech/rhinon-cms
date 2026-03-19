import mongoose, { Schema, Document } from "mongoose";

export interface IBlog extends Document {
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  coverImage?: string;
  tags: string[];
  readTime: string;
  publishedAt: Date;
  status: "Draft" | "Published";
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    author: {
      name: { type: String, required: true, default: "Prabhat Patra" },
      role: { type: String, required: true, default: "Founder @ Rhinon Labs" },
      avatar: { type: String },
    },
    coverImage: { type: String },
    tags: [{ type: String }],
    readTime: { type: String, default: "5 min read" },
    publishedAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ["Draft", "Published"],
      default: "Published" 
    },
  },
  { timestamps: true, collection: 'blogs' }
);

export default mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema);
