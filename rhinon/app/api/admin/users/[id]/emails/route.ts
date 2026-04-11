import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-auth";
import { requireCapability } from "@/lib/authorization";
import dbConnect from "@/lib/mongodb";
import OutreachEmail from "@/lib/models/OutreachEmail";
import User from "@/lib/models/User";
import { writeAuditLog } from "@/lib/audit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = getRequestUser(req);
  const auth = requireCapability(sessionUser, "manage_users");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    await dbConnect();

    const emails = await OutreachEmail.find({ userId: id, status: "Active" })
      .sort({ type: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ emails });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = getRequestUser(req);
  const auth = requireCapability(sessionUser, "manage_users");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const currentUser = sessionUser!;

  try {
    const { id } = await params;
    const { email, displayName } = await req.json();

    if (!email || !displayName) {
      return NextResponse.json({ error: "Email and display name are required" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail.endsWith("@rhinonlabs.com")) {
      return NextResponse.json({ error: "Email must use the @rhinonlabs.com domain" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newEmail = await OutreachEmail.create({
      email: normalizedEmail,
      displayName,
      type: "secondary",
      status: "Active",
      userId: id,
    });

    await writeAuditLog({
      actor: currentUser,
      action: "mailbox.created",
      targetType: "outreach_identity",
      targetId: newEmail._id.toString(),
      metadata: { email: normalizedEmail, displayName, assignedTo: id },
    });

    return NextResponse.json({ success: true, email: newEmail });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "This email address is already in use" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
