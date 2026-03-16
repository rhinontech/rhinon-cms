import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SocialPost from "@/lib/models/SocialPost";
import { getRequestUser } from "@/lib/request-auth";
import { serializeSocialPost } from "@/lib/serializers";

export async function GET(req: Request) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const posts = await SocialPost.find({}).sort({ createdAt: -1 });
    return NextResponse.json(posts.map(serializeSocialPost));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await req.json();
    
    // Generate slug for articles if title exists
    if (body.channel === "LinkedIn Article" && !body.slug && body.title) {
        body.slug = body.title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    const post = await SocialPost.create(body);
    return NextResponse.json(serializeSocialPost(post));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
