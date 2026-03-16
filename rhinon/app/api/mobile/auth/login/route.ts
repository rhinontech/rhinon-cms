import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";
import { issueMobileToken } from "@/lib/request-auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const user = loginUser(email, password);

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    return NextResponse.json({
      token: issueMobileToken(user),
      user,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
