import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";
import { getRequestUser } from "@/lib/request-auth";
import { serializeCampaign } from "@/lib/serializers";

export async function GET(req: Request) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 });
    return NextResponse.json(campaigns.map(serializeCampaign));
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
    const campaign = await Campaign.create(body);
    return NextResponse.json(serializeCampaign(campaign));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
