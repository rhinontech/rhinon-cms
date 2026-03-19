import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getRequestUser } from "@/lib/request-auth";
import crypto from "crypto";
import { sendEmail } from "@/lib/mail";
import { saveEmailToS3 } from "@/lib/s3";

export async function POST(req: Request) {
  const adminUser = getRequestUser(req);
  if (!adminUser || adminUser.roleSlug !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, personalEmail, workEmailPrefix, roleId } = await req.json();

    if (!name || !personalEmail || !workEmailPrefix || !roleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    const workEmail = `${workEmailPrefix.toLowerCase()}@rhinonlabs.com`;

    // Check if email already exists
    const existingUser = await User.findOne({ email: workEmail });

    if (existingUser) {
      return NextResponse.json({ error: "Work account already exists" }, { status: 400 });
    }

    const invitationToken = crypto.randomBytes(32).toString("hex");
    const tempPassword = Math.random().toString(36).slice(-10);

    const newUser = await User.create({
      name,
      email: workEmail,
      roleId,
      status: "Invited",
      invitationToken,
      password: tempPassword,
      isTemporaryPassword: true,
      mustChangePassword: true,
      joinedAt: new Date(),
    });

    // Send the invitation email to PERSONAL EMAIL
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.rhinon.tech"}/login?email=${encodeURIComponent(workEmail)}`;
    
    const inviteHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0891b2;">Welcome to the Team</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your managed work account for Rhinon CMS has been successfully created.</p>
          
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #0369a1;">Login Credentials:</p>
            <p style="margin: 5px 0; font-size: 16px; color: #0891b2;"><strong>Email:</strong> ${workEmail}</p>
            <p style="margin: 5px 0; font-size: 16px; color: #0891b2;"><strong>Temp Password:</strong> ${tempPassword}</p>
          </div>
 
          <p>Please click the button below to log in. You will be asked to set a new password immediately:</p>
          <a href="${inviteLink}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Access My Account</a>
          
          <p style="font-size: 12px; color: #666; margin-top: 20px;">This link is sent to your personal email for security. Please do not share these credentials.</p>
        </div>
      `;

    const info = await sendEmail({
      to: personalEmail,
      fromEmail: "admin@rhinonlabs.com",
      subject: "Welcome to your Rhinon Work Account",
      text: `Hi ${name},\n\nYour work account has been created.\n\nWork Email: ${workEmail}\nTemporary Password: ${tempPassword}\n\nLogin here: ${inviteLink}\n\nYou will be required to change your password upon first login.`,
      html: inviteHtml,
    });

    // Archive to S3 for Inbox history
    const messageId = info.messageId || `invite-${newUser._id}`;
    const rawEml = [
      `From: "Admin" <admin@rhinonlabs.com>`,
      `To: ${personalEmail}`,
      `Subject: Welcome to your Rhinon Work Account`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${messageId}>`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      inviteHtml
    ].join("\r\n");

    try {
      await saveEmailToS3("admin@rhinonlabs.com", "outbound", messageId, rawEml);
    } catch (s3Err) {
      console.error("Failed to archive invite to S3:", s3Err);
    }

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error("Invite User Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
