import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import AiActivity from "@/lib/models/AiActivity";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const activities = await AiActivity.find({ campaignId: id })
      .sort({ timestamp: -1 })
      .limit(50);
    return NextResponse.json(activities);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
