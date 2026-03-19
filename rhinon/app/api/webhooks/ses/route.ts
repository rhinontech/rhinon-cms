import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InboundEmail from "@/lib/models/InboundEmail";
import OutreachEmail from "@/lib/models/OutreachEmail";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // AWS SES notifications via SNS or Lambda usually have a specific format
    // For this implementation, we assume a simplified format sent by a Lambda or SNS
    const { messageId, from, to, subject, snippet, s3Key, timestamp } = body;

    await dbConnect();

    // Check if the recipient is one of our managed outreach identities
    const identity = await OutreachEmail.findOne({ email: to });
    if (!identity) {
      console.warn(`Received email for unknown identity: ${to}`);
      return NextResponse.json({ received: false, reason: "Unknown identity" });
    }

    // Create the inbound email record
    await InboundEmail.create({
      messageId,
      from,
      to,
      subject,
      snippet,
      s3Key,
      receivedAt: timestamp ? new Date(timestamp) : new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("SES Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
