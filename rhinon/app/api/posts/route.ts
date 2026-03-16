import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SocialPost from "@/lib/models/SocialPost";

export async function GET() {
  try {
    await dbConnect();
    const posts = await SocialPost.find({}).sort({ createdAt: -1 });
    return NextResponse.json(posts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
    return NextResponse.json(post);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
