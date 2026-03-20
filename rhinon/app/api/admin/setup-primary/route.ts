import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import OutreachEmail from "@/lib/models/OutreachEmail";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { name, password } = await req.json(); // In a real app, hash the password

    const primaryEmail = "admin@rhinonlabs.com";
    const adminName = name || "Prabhat Patra";

    const admin = await User.findOneAndUpdate(
      { email: primaryEmail },
      {
        $set: {
          name: adminName,
          email: primaryEmail,
          isPrimaryAdmin: true,
          roleId: "role_admin",
          status: "Active",
          joinedAt: new Date(),
          ...(password ? { password } : {}),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const identity = await OutreachEmail.findOneAndUpdate(
      { email: primaryEmail },
      {
        $set: {
          email: primaryEmail,
          type: "primary",
          displayName: "Prabhat Patra",
          status: "Active",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await writeAuditLog({
      action: "system.default_admin_bootstrap",
      targetType: "user",
      targetId: admin._id.toString(),
      metadata: {
        email: primaryEmail,
        identityId: identity._id.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Default admin and primary outreach identity are configured",
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
