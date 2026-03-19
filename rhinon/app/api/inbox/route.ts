import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-auth";
import { fetchUserEmailsFromS3 } from "@/lib/s3";

export async function GET(req: Request) {
  const sessionUser = getRequestUser(req);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const targetEmail = searchParams.get("email") || (sessionUser.isPrimaryAdmin ? "admin@rhinonlabs.com" : sessionUser.email);

    // Security: Only admins can check multiple outreach inboxes
    if (targetEmail !== sessionUser.email && sessionUser.roleSlug !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const emails = await fetchUserEmailsFromS3(targetEmail);

    return NextResponse.json({ emails });
  } catch (error: any) {
    console.error("Failed to fetch inbox:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
