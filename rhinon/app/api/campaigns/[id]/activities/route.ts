import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import AiActivity from "@/lib/models/AiActivity";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const activities = await AiActivity.find({ campaignId: params.id })
      .sort({ timestamp: -1 })
      .limit(50);
    return NextResponse.json(activities);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
