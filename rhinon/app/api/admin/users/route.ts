import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-auth";
import { requireCapability } from "@/lib/authorization";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { serializeUser } from "@/lib/serializers";

export async function GET(req: Request) {
  const sessionUser = getRequestUser(req);
  const auth = requireCapability(sessionUser, "manage_users");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await dbConnect();
    const users = await User.find().sort({ joinedAt: 1 }).lean();
    return NextResponse.json({ users: users.map(serializeUser) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
