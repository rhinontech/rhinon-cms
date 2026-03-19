import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import OutreachEmail from "@/lib/models/OutreachEmail";

export async function POST(req: Request) {
  try {
    await dbConnect();

    // Check if primary admin already exists
    const existingAdmin = await User.findOne({ isPrimaryAdmin: true });
    
    if (existingAdmin) {
      return NextResponse.json({ error: "Primary admin already exists" }, { status: 400 });
    }

    const { name, password } = await req.json(); // In a real app, hash the password

    const primaryEmail = "admin@rhinonlabs.com";

    // Create Primary Admin
    const admin = await User.create({
      name: name || "Primary Admin",
      email: primaryEmail,
      isPrimaryAdmin: true,
      roleId: "role_admin",
      status: "Active",
      joinedAt: new Date(),
    });

    // Create Primary Outreach Identity
    await OutreachEmail.create({
      email: primaryEmail,
      type: "primary",
      displayName: "Default Admin Outreach",
      status: "Active",
    });

    return NextResponse.json({ 
      success: true, 
      message: "Primary admin and outreach identity created",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });

  } catch (error: any) {
    console.error("Setup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
