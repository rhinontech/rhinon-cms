import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import axios from "axios";
import { getLinkedInConnectionStatus } from "@/lib/connectors/linkedin";

export async function GET() {
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
      await axios.post("https://api.apollo.io/v1/people/search", {
        api_key: apolloKey,
        q_keywords: "rhinon",
        page: 1,
        per_page: 1
      }, { timeout: 5000 });
      status.apollo = { status: "healthy", message: "Connected to Lead Discovery Engine" };
    }
  } catch (error: any) {
    status.apollo = { status: "error", message: error.response?.data?.error || error.message };
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

  // 3. Check SMTP
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_PORT === "465",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      connectionTimeout: 5000,
    });
    
    await transporter.verify();
    status.smtp = { status: "healthy", message: "SMTP Delivery Engine Connected" };
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

  return NextResponse.json(status);
}
