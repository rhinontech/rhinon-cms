import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import axios from "axios";
import { getLinkedInConnectionStatus } from "@/lib/connectors/linkedin";
import { getRequestUser } from "@/lib/request-auth";
import { serializeSystemHealth } from "@/lib/serializers";

export async function GET(req: Request) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = {
    apollo: { status: "unknown", message: "" },
    gemini: { status: "unknown", message: "" },
    smtp: { status: "unknown", message: "" },
    linkedin: { status: "unknown", message: "" },
  };

  // 1. Check Apollo
  try {
    const apolloKey = process.env.APOLLO_API_KEY;
    if (!apolloKey) {
      status.apollo = { status: "missing", message: "API Key not configured in .env" };
    } else {
      // Use people/match as a health check since search is restricted
      await axios.post("https://api.apollo.io/v1/people/match", {
        email: "test@example.com",
        first_name: "Test",
        last_name: "User"
      }, { 
        headers: {
          'X-Api-Key': apolloKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000 
      });
      status.apollo = { status: "healthy", message: "Match & Enrichment Engine Ready" };
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
    status.apollo = { status: "error", message: errorMsg };
  }

  // 2. Check Gemini
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      status.gemini = { status: "missing", message: "API Key not configured in .env" };
    } else {
      status.gemini = { status: "healthy", message: "AI Intelligence Engine Ready" };
    }
  } catch (error: any) {
    status.gemini = { status: "error", message: error.message };
  }

  // 3. Check SES (Delivery Engine)
  try {
    const { SESv2Client, GetEmailIdentityCommand } = await import("@aws-sdk/client-sesv2");
    const ses = new SESv2Client({
      region: process.env.AWS_REGION || "ap-south-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const user = getRequestUser(req);
    // Determine the domain to check (default to rhinonlabs.com or user's domain)
    const domain = user?.email?.split('@')[1] || "rhinonlabs.com";
    
    const command = new GetEmailIdentityCommand({ EmailIdentity: domain });
    const identity = await ses.send(command);
    
    if (identity.VerifiedForSendingStatus) {
      status.smtp = { 
        status: "healthy", 
        message: `SES Identity (${domain}) Verified & Ready` 
      };
    } else {
      status.smtp = { 
        status: "error", 
        message: `SES Identity (${domain}) Verification Pending` 
      };
    }
  } catch (error: any) {
    status.smtp = { status: "error", message: error.message };
  }

  // 4. Check LinkedIn
  try {
    const liStatus = await getLinkedInConnectionStatus();
    if (liStatus.connected) {
      status.linkedin = { 
        status: liStatus.isExpired ? "error" : "healthy", 
        message: liStatus.isExpired ? "Token expired, please reconnect" : "Connected as " + (liStatus.profile?.name || "Member") 
      };
    } else {
      status.linkedin = { status: "missing", message: "LinkedIn Account not connected" };
    }
  } catch (err: any) {
    status.linkedin = { status: "error", message: err.message };
  }

  return NextResponse.json(serializeSystemHealth(status));
}
