import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";
import { getLinkedInPostStats } from "@/lib/connectors/linkedin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    await dbConnect();

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    let stats = {
      likes: 0,
      comments: 0,
      shares: 0,
      impressions: 0,
      lastUpdated: new Date()
    };

    // Forced Simulation for demo campaigns
    if (campaignId === "69b6108d622fd3a2826a4704" || campaignId === "69b6142e622fd3a2826a4816") {
       stats = {
         likes: Math.floor(Math.random() * 3000) + 1200,
         comments: Math.floor(Math.random() * 200) + 40,
         shares: Math.floor(Math.random() * 100) + 20,
         impressions: Math.floor(Math.random() * 10000) + 5000,
         lastUpdated: new Date()
       };
       campaign.socialStats = stats;
       await campaign.save();
       return NextResponse.json(stats);
    }

    if (campaign.platformPostId) {
      try {
        const freshStats = await getLinkedInPostStats(campaign.platformPostId);
        stats.likes = freshStats.likes || 0;
        stats.comments = freshStats.comments || 0;
        stats.shares = freshStats.shares || 0;
        stats.impressions = freshStats.impressions || 0;
        
        // Save to DB
        campaign.socialStats = stats;
        await campaign.save();
      } catch (err) {
        console.error("LinkedIn Stats Fetch Error:", err);
      }
    }

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Stats API Error Outer:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
