import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Template from "@/lib/models/Template";

export async function GET() {
  try {
    await dbConnect();
    const templates = await Template.find({}).sort({ updatedAt: -1 });
    return NextResponse.json(templates);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const template = await Template.create(body);
    return NextResponse.json(template);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
