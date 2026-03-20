import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import OutreachEmail from "@/lib/models/OutreachEmail";
import { getRequestUser } from "@/lib/request-auth";
import { encodeSession, SESSION_COOKIE, getRoleSlug } from "@/lib/auth";
import { ROLE_CAPABILITIES, type RoleSlug } from "@/lib/authorization";

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
    dbUser.status = "Active";
    await dbUser.save();

    // Create a new session object without the mustChangePassword flag
    const roleSlug = getRoleSlug(dbUser.roleId) as RoleSlug;
    const primaryIdentity = await OutreachEmail.findOne({ email: dbUser.email, status: "Active" }).lean();

    const updatedSessionUser = {
      id: dbUser._id.toString(),
      name: dbUser.name,
      email: dbUser.email,
      linkedinUrl: dbUser.linkedinUrl,
      linkedinConnected: dbUser.linkedinConnected,
      roleId: dbUser.roleId,
      roleName: sessionUser.roleName,
      roleSlug,
      activeIdentityEmail: primaryIdentity?.email || dbUser.email,
      primaryIdentityEmail: primaryIdentity?.email || dbUser.email,
      capabilities: ROLE_CAPABILITIES[roleSlug] || [],
      mustChangePassword: false,
    };

    const response = NextResponse.json({ 
      success: true, 
      roleSlug: updatedSessionUser.roleSlug,
      user: updatedSessionUser,
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
