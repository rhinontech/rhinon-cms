import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/lib/models/Lead";
import { getRequestUser } from "@/lib/request-auth";
import { serializeLead } from "@/lib/serializers";

export async function GET(req: Request) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const leads = await Lead.find({}).sort({ addedAt: -1 });
    return NextResponse.json(leads.map(serializeLead));
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
    const lead = await Lead.create(body);
    return NextResponse.json(serializeLead(lead));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
