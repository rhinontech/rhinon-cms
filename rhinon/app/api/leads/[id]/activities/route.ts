import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import AiActivity from "@/lib/models/AiActivity";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const activities = await AiActivity.find({ leadId: id })
      .sort({ timestamp: -1 });
    return NextResponse.json(activities);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
