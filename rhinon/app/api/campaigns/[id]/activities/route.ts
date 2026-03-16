import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import AiActivity from "@/lib/models/AiActivity";
import { getRequestUser } from "@/lib/request-auth";
import { serializeAiActivity } from "@/lib/serializers";

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
    const activities = await AiActivity.find({ campaignId: id })
      .sort({ timestamp: -1 })
      .limit(50);
    return NextResponse.json(activities.map(serializeAiActivity));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
