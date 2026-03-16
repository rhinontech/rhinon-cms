import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-auth";

export async function GET(req: NextRequest) {
  const user = getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(user);
}
