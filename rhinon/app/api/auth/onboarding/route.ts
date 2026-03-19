import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getRequestUser } from "@/lib/request-auth";
import { encodeSession, SESSION_COOKIE, getRoleSlug } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const sessionUser = getRequestUser(req);

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    const dbUser = await User.findById(sessionUser.id);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (dbUser.password && currentPassword !== dbUser.password) {
      return NextResponse.json({ error: "Incorrect temporary password" }, { status: 400 });
    }

    // Update the user's password and remove the reset flags
    dbUser.password = newPassword;
    dbUser.isTemporaryPassword = false;
    dbUser.mustChangePassword = false;
    await dbUser.save();

    // Create a new session object without the mustChangePassword flag
    const updatedSessionUser = {
      id: dbUser._id.toString(),
      name: dbUser.name,
      email: dbUser.email,
      linkedinUrl: dbUser.linkedinUrl,
      linkedinConnected: dbUser.linkedinConnected,
      roleId: dbUser.roleId,
      roleName: sessionUser.roleName,
      roleSlug: getRoleSlug(dbUser.roleId),
      mustChangePassword: false, 
    };

    const response = NextResponse.json({ 
      success: true, 
      roleSlug: updatedSessionUser.roleSlug 
    });

    response.cookies.set(SESSION_COOKIE, encodeSession(updatedSessionUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error: any) {
    console.error("Onboarding Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
