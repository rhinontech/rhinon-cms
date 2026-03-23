import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";
import Lead from "@/lib/models/Lead";
import AiActivity from "@/lib/models/AiActivity";
import { deleteLinkedInPost } from "@/lib/connectors/linkedin";
import { getRequestUser } from "@/lib/request-auth";
import { serializeCampaign } from "@/lib/serializers";

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
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json(serializeCampaign(campaign));
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
    const campaign = await Campaign.findByIdAndUpdate(id, body, { new: true });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json(serializeCampaign(campaign));
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
    const { id: campaignId } = await params;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // LinkedIn Sync: Remove post from LinkedIn if it exists
    if (campaign.platformPostId) {
      try {
        await deleteLinkedInPost(campaign.platformPostId);
      } catch (err) {
        console.error("Failed to delete post from LinkedIn during campaign cleanup:", err);
      }
    }

    await Campaign.findByIdAndDelete(campaignId);

    // Preserve leads in the CRM and simply detach them from the deleted campaign.
    await Lead.updateMany(
      { campaignId, status: "Enrolled" },
      { $set: { campaignId: null, status: "New" } }
    );
    await Lead.updateMany(
      { campaignId, status: { $ne: "Enrolled" } },
      { $set: { campaignId: null } }
    );

    // Clean up associated AI Activities
    await AiActivity.deleteMany({ campaignId });

    return NextResponse.json({ success: true, message: "Campaign and associated data deleted." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
