import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SocialPost from "@/lib/models/SocialPost";
import { postToLinkedIn } from "@/lib/connectors/linkedin";
import { getRequestUser } from "@/lib/request-auth";

export async function POST(
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

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.status === "Published") {
        return NextResponse.json({ error: "Post already published" }, { status: 400 });
    }

    try {
      const mediaUrls = post.mediaUrl ? [post.mediaUrl] : [];
      
      const result = await postToLinkedIn(post.content, mediaUrls, {
        visibility: post.visibility,
        channel: post.channel,
        articleUrl: post.articleUrl,
        mediaTitle: post.title, // Use the actual post title
        mediaDescription: post.mediaDescription,
        campaignId: post._id, // Keep for backwards compatibility with ID lookups
        slug: post.slug
      });

      post.platformPostId = result.postId;
      post.status = "Published";
      await post.save();

      return NextResponse.json({ 
        success: true, 
        postId: result.postId,
        message: "Social post successfully published to LinkedIn."
      });
    } catch (err: any) {
       console.error(`Error publishing social post ${post._id}:`, err);
       post.status = "Failed";
       await post.save();
       return NextResponse.json({ 
         error: "Failed to publish social post.", 
         details: err.message || "Unknown error"
       }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
