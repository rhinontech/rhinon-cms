import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Template from "@/lib/models/Template";
import { getRequestUser } from "@/lib/request-auth";
import { serializeTemplate } from "@/lib/serializers";

export async function GET(req: Request) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const templates = await Template.find({}).sort({ updatedAt: -1 });
    return NextResponse.json(templates.map(serializeTemplate));
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
    const template = await Template.create(body);
    return NextResponse.json(serializeTemplate(template));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
