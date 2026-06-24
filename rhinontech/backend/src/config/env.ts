import dotenv from "dotenv";
dotenv.config();

const parseCsv = (value?: string) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4200";

export const env = {
  port: parseInt(process.env.PORT || "5000", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "rhinon-dev-secret-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendUrl,
  frontendUrls: Array.from(new Set([frontendUrl, ...parseCsv(process.env.FRONTEND_URLS)])),
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || "",
  },
  github: {
    token: process.env.GITHUB_TOKEN || "",
    org: process.env.GITHUB_ORG || "",
  },
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  cronSecret: process.env.CRON_SECRET || "rhinon-cron-secret",
  // Optional: where to send a heads-up when a new lead comes in from the marketing site.
  // Leave unset to disable notifications (lead is still saved).
  leadsNotifyEmail: process.env.LEADS_NOTIFY_EMAIL || "",
};
