import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-auth";
import { requireCapability } from "@/lib/authorization";
import dbConnect from "@/lib/mongodb";
import OutreachEmail from "@/lib/models/OutreachEmail";
import { writeAuditLog } from "@/lib/audit";

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

    const identity = await OutreachEmail.findById(id);
    if (!identity) {
      return NextResponse.json({ error: "Identity not found" }, { status: 404 });
    }

    if (identity.type === "primary") {
      return NextResponse.json({ error: "Primary email identity cannot be removed" }, { status: 400 });
    }

    await identity.deleteOne();

    await writeAuditLog({
      actor: currentUser,
      action: "mailbox.deleted",
      targetType: "outreach_identity",
      targetId: id,
      metadata: { email: identity.email, displayName: identity.displayName },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
