import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SocialPost from "@/lib/models/SocialPost";
import { deleteLinkedInPost } from "@/lib/connectors/linkedin";
import { getRequestUser } from "@/lib/request-auth";
import { serializeSocialPost } from "@/lib/serializers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { id } = await params;
    const post = await SocialPost.findById(id);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    return NextResponse.json(serializeSocialPost(post));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    
    // Update slug if title changed and it's an article
    if (body.channel === "LinkedIn Article" && body.title) {
        body.slug = body.title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    const post = await SocialPost.findByIdAndUpdate(id, body, { new: true });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    return NextResponse.json(serializeSocialPost(post));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { id } = await params;
    const post = await SocialPost.findById(id);
    
    if (post?.platformPostId) {
        try {
            await deleteLinkedInPost(post.platformPostId);
        } catch (e) {
            console.error("LinkedIn Delete Skill Failed:", e);
        }
    }

    await SocialPost.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
