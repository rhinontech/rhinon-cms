import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Template from "@/lib/models/Template";
import { getRequestUser } from "@/lib/request-auth";
import { serializeTemplate } from "@/lib/serializers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await dbConnect();
    const template = await Template.findById(id);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    return NextResponse.json(serializeTemplate(template));
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
    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    const template = await Template.findByIdAndUpdate(id, body, { new: true });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    return NextResponse.json(serializeTemplate(template));
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
    const { id } = await params;
    await dbConnect();
    await Template.findByIdAndDelete(id);
    return NextResponse.json({ message: "Template deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
