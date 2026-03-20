import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import OutreachEmail from "@/lib/models/OutreachEmail";
import { getRequestUser } from "@/lib/request-auth";
import { requireCapability } from "@/lib/authorization";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
  const adminUser = getRequestUser(req);
  const auth = requireCapability(adminUser, "manage_mailboxes");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await dbConnect();
    await OutreachEmail.findOneAndUpdate(
      { email: "admin@rhinonlabs.com" },
      {
        $set: {
          email: "admin@rhinonlabs.com",
          displayName: "Prabhat Patra",
          type: "primary",
          status: "Active",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const emails = await OutreachEmail.find().sort({ type: 1, createdAt: -1 });
    return NextResponse.json({ emails });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const adminUser = getRequestUser(req);
  const auth = requireCapability(adminUser, "manage_mailboxes");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { email, displayName } = await req.json();
    if (!email || !displayName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await dbConnect();
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail.endsWith("@rhinonlabs.com")) {
      return NextResponse.json({ error: "Identity must use the @rhinonlabs.com domain" }, { status: 400 });
    }

    const newEmail = await OutreachEmail.create({
      email: normalizedEmail,
      displayName,
      type: "secondary",
      status: "Active"
    });

    await writeAuditLog({
      actor: adminUser,
      action: "mailbox.created",
      targetType: "outreach_identity",
      targetId: newEmail._id.toString(),
      metadata: { email: normalizedEmail, displayName },
    });

    return NextResponse.json({ success: true, email: newEmail });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
