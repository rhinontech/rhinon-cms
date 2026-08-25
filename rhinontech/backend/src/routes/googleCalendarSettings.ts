import { Router, Request, Response } from "express";
import { oauth2 as googleOauth2 } from "@googleapis/oauth2";
import { GoogleCalendarToken, getActiveCalendarToken } from "../models/GoogleCalendarToken";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { buildOAuthClient, getConnectionStatus, GOOGLE_CALENDAR_SCOPES } from "../services/googleCalendar";

const router = Router();

// GET /google-calendar/status — what the Settings screen renders. Never returns tokens.
router.get("/status", authenticate, authorize("settings:write"), async (_req: AuthRequest, res: Response) => {
  try {
    res.json(await getConnectionStatus());
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /google-calendar/auth — build the consent URL for the one-time connect.
router.get("/auth", authenticate, authorize("settings:write"), async (req: AuthRequest, res: Response) => {
  const oauth2Client = buildOAuthClient();
  if (!oauth2Client) {
    res.status(400).json({ message: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set on the server." });
    return;
  }

  // The callback is unauthenticated (it's a redirect from Google), so carry the role slug
  // through `state` to land back on the right /[role]/settings/... URL afterwards.
  const state = Buffer.from(JSON.stringify({ roleSlug: req.user!.roleSlug })).toString("base64");
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // required to receive a refresh_token at all
    prompt: "consent", // force a fresh refresh_token even on re-consent
    scope: GOOGLE_CALENDAR_SCOPES,
    state,
  });

  res.json({ authUrl });
});

// GET /google-calendar/callback — OAuth redirect target. Unauthenticated by necessity:
// Google's redirect can't carry an Authorization header (same as routes/linkedin.ts).
router.get("/callback", async (req: Request, res: Response) => {
  const { code, error, state } = req.query as Record<string, string>;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4200";

  let roleSlug = "superadmin";
  try {
    if (state) roleSlug = JSON.parse(Buffer.from(state, "base64").toString("utf-8")).roleSlug || roleSlug;
  } catch {
    /* malformed state — fall back to the default landing URL */
  }
  const settingsUrl = `${frontendUrl}/${roleSlug}/settings/google-calendar`;

  if (error) {
    res.redirect(`${settingsUrl}?error=${encodeURIComponent(error)}`);
    return;
  }
  if (!code) {
    res.redirect(`${settingsUrl}?error=missing_code`);
    return;
  }

  try {
    const oauth2Client = buildOAuthClient();
    if (!oauth2Client) {
      res.redirect(`${settingsUrl}?error=not_configured`);
      return;
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const { data: profile } = await googleOauth2({ version: "v2", auth: oauth2Client as any }).userinfo.get();

    // Google only returns a refresh_token on first consent for a given client/account pair;
    // `prompt: "consent"` above should force one, but fall back to the previous value rather
    // than storing a row that can never refresh.
    const previous = await getActiveCalendarToken();
    const refreshToken = tokens.refresh_token || previous?.refreshToken;
    if (!refreshToken) {
      res.redirect(`${settingsUrl}?error=no_refresh_token`);
      return;
    }

    await GoogleCalendarToken.update({ isActive: false }, { where: { isActive: true } });
    await GoogleCalendarToken.create({
      refreshToken,
      accessToken: tokens.access_token ?? null,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      connectedEmail: profile.email ?? null,
      calendarId: "primary",
      isActive: true,
    });

    res.redirect(`${settingsUrl}?connected=1`);
  } catch (err: any) {
    console.error("Google Calendar OAuth callback failed:", err.response?.data || err.message);
    res.redirect(`${settingsUrl}?error=auth_failed`);
  }
});

// POST /google-calendar/disconnect
router.post("/disconnect", authenticate, authorize("settings:write"), async (_req: AuthRequest, res: Response) => {
  try {
    await GoogleCalendarToken.update({ isActive: false }, { where: { isActive: true } });
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
