import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import OutreachEmail from "@/lib/models/OutreachEmail";
import { getRequestUser } from "@/lib/request-auth";

export async function GET(req: Request) {
  const adminUser = getRequestUser(req);
  if (!adminUser || adminUser.roleSlug !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const emails = await OutreachEmail.find().sort({ type: 1, createdAt: -1 });
    return NextResponse.json({ emails });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const adminUser = getRequestUser(req);
  if (!adminUser || adminUser.roleSlug !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, displayName } = await req.json();
    if (!email || !displayName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await dbConnect();
    const newEmail = await OutreachEmail.create({
      email,
      displayName,
      type: "secondary",
      status: "Active"
    });

    return NextResponse.json({ success: true, email: newEmail });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
