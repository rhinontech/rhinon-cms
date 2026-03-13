import { NextRequest, NextResponse } from "next/server";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE);
  if (!cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = decodeSession(cookie.value);
  if (!user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  return NextResponse.json(user);
}
