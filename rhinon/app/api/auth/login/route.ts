import { NextRequest, NextResponse } from "next/server";
import { loginUser, encodeSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const user = loginUser(email, password);

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const response = NextResponse.json({ roleSlug: user.roleSlug });
    response.cookies.set(SESSION_COOKIE, encodeSession(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Interal Server Error" }, { status: 500 });
  }
}
