import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-auth";
import { requireCapability } from "@/lib/authorization";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import OutreachEmail from "@/lib/models/OutreachEmail";
import { serializeUser } from "@/lib/serializers";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
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
    const { email } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.endsWith("@rhinonlabs.com")) {
      return NextResponse.json({ error: "Email must use the @rhinonlabs.com domain" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isPrimaryAdmin) {
      return NextResponse.json({ error: "Primary admin email cannot be changed" }, { status: 400 });
    }

    const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const previousEmail = user.email;
    user.email = normalizedEmail;
    await user.save();

    await OutreachEmail.updateMany(
      {
        $or: [{ userId: user._id.toString() }, { email: previousEmail }],
      },
      {
        $set: { email: normalizedEmail, userId: user._id.toString() },
      }
    );

    await writeAuditLog({
      actor: currentUser,
      action: "user.email_updated",
      targetType: "user",
      targetId: user._id.toString(),
      metadata: { previousEmail, email: normalizedEmail },
    });

    return NextResponse.json({ success: true, user: serializeUser(user) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
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
    await dbConnect();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isPrimaryAdmin) {
      return NextResponse.json({ error: "Primary admin cannot be deleted" }, { status: 400 });
    }

    const deletedEmail = user.email;
    await OutreachEmail.deleteMany({
      $or: [{ userId: user._id.toString() }, { email: deletedEmail }],
    });
    await user.deleteOne();

    await writeAuditLog({
      actor: currentUser,
      action: "user.deleted",
      targetType: "user",
      targetId: id,
      metadata: { email: deletedEmail },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
