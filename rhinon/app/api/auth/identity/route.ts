import { NextResponse } from "next/server";
import { encodeSession, SESSION_COOKIE } from "@/lib/auth";
import { getRequestUser } from "@/lib/request-auth";
import { requireCapability } from "@/lib/authorization";
import dbConnect from "@/lib/mongodb";
import OutreachEmail from "@/lib/models/OutreachEmail";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const sessionUser = getRequestUser(req);
  const auth = requireCapability(sessionUser, "send_email");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const currentUser = sessionUser!;

  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await dbConnect();
    const identity = await OutreachEmail.findOne({ email, status: "Active" }).lean();
    if (!identity) {
      return NextResponse.json({ error: "Identity not found" }, { status: 404 });
    }

    const availableIdentities = currentUser.capabilities.includes("manage_mailboxes")
      ? await OutreachEmail.find({ status: "Active" }).select("email").lean()
      : await OutreachEmail.find({
        status: "Active",
        email: { $in: [currentUser.email, currentUser.primaryIdentityEmail, currentUser.activeIdentityEmail] },
      }).select("email").lean();

    const canSwitchOtherIdentity = availableIdentities.some((item) => item.email === email);

    if (!canSwitchOtherIdentity) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedSession = {
      ...currentUser,
      activeIdentityEmail: email,
    };

    const response = NextResponse.json({ success: true, user: updatedSession });
    response.cookies.set(SESSION_COOKIE, encodeSession(updatedSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    await writeAuditLog({
      actor: currentUser,
      action: "identity.switch_active",
      targetType: "outreach_identity",
      targetId: identity._id?.toString(),
      metadata: { email },
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
