import dotenv from "dotenv";
dotenv.config();

const parseCsv = (value?: string) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

/**
 * Anything that is not explicitly development or test is treated as a real
 * deployment. NODE_ENV is not reliably set on our servers, so "is this
 * production?" cannot be answered by looking for the word "production" — a
 * safety check that only fires when that variable happens to be set is a check
 * that silently does nothing on the box that matters.
 */
export const isDevOrTest = ["development", "test"].includes(process.env.NODE_ENV || "");

/**
 * Secrets that used to have a hard-coded fallback committed to the repo. With a
 * fallback, forgetting the variable in a deployment meant every token was signed
 * with a publicly known key — anyone could mint a superadmin JWT. Refuse to boot
 * instead; development keeps a fixed value so `npm run dev` works untouched.
 */
function requiredSecret(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value && value !== devFallback) return value;
  if (isDevOrTest) return value || devFallback;
  throw new Error(
    `[Config] ${name} is not set (or is still the development default). ` +
      `Set it to a long random value before starting this server.`
  );
}

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4200";

export const env = {
  port: parseInt(process.env.PORT || "5000", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: requiredSecret("JWT_SECRET", "rhinon-dev-secret-change-in-production"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendUrl,
  frontendUrls: Array.from(new Set([frontendUrl, ...parseCsv(process.env.FRONTEND_URLS)])),
  // Public marketing site origin — used to treat same-site referrers as Direct in analytics.
  siteUrl: process.env.SITE_URL || "https://rhinonlabs.com",
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || "",
  },
  github: {
    token: process.env.GITHUB_TOKEN || "",
    org: process.env.GITHUB_ORG || "",
  },
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  cronSecret: requiredSecret("CRON_SECRET", "rhinon-cron-secret"),
  // Optional: where to send a heads-up when a new lead comes in from the marketing site.
  // Leave unset to disable notifications (lead is still saved).
  leadsNotifyEmail: process.env.LEADS_NOTIFY_EMAIL || "",
};
