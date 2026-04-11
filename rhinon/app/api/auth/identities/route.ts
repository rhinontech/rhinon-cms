import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-auth";
import { requireCapability } from "@/lib/authorization";
import dbConnect from "@/lib/mongodb";
import OutreachEmail from "@/lib/models/OutreachEmail";

export async function GET(req: Request) {
  const sessionUser = getRequestUser(req);
  const auth = requireCapability(sessionUser, "send_email");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const currentUser = sessionUser!;

  try {
    await dbConnect();

    let identities;

    if (currentUser.capabilities.includes("manage_mailboxes")) {
      // Super admin sees all active identities
      identities = await OutreachEmail.find({ status: "Active" }).sort({ type: 1, createdAt: -1 }).lean();
    } else {
      // Other users see only identities assigned to them (by userId),
      // plus their primary identity as a fallback
      identities = await OutreachEmail.find({
        status: "Active",
        $or: [
          { userId: currentUser.id },
          { email: currentUser.primaryIdentityEmail },
        ],
      }).sort({ type: 1, createdAt: -1 }).lean();
    }

    return NextResponse.json({ emails: identities });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
