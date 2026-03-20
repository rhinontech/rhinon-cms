import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-auth";
import { fetchUserEmailsFromS3 } from "@/lib/s3";
import { requireCapability } from "@/lib/authorization";

export async function GET(req: Request) {
  const sessionUser = getRequestUser(req);
  const auth = requireCapability(sessionUser, "send_email");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const currentUser = sessionUser!;

  try {
    const { searchParams } = new URL(req.url);
    const targetEmail = searchParams.get("email") || currentUser.activeIdentityEmail;

    // Security: Only admins can check multiple outreach inboxes
    if (targetEmail !== currentUser.activeIdentityEmail && !currentUser.capabilities.includes("manage_mailboxes")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const emails = await fetchUserEmailsFromS3(targetEmail);

    return NextResponse.json({ emails });
  } catch (error: any) {
    console.error("Failed to fetch inbox:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
