import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { oauth2 as googleOauth2 } from "@googleapis/oauth2";
import { GoogleCalendarToken, getActiveCalendarToken } from "../models/GoogleCalendarToken";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { buildOAuthClient, getConnectionStatus, GOOGLE_CALENDAR_SCOPES } from "../services/googleCalendar";
import { runForOrg } from "../services/tenantContext";
import { env } from "../config/env";

const router = Router();

interface CalendarState {
  organizationId: string;
  userId: string;
  roleSlug: string;
}

function signCalendarState(state: CalendarState): string {
  return jwt.sign({ ...state, purpose: "connect-calendar" }, env.jwtSecret, { expiresIn: "10m" });
}

/** The state Google hands back, or null if it is missing, expired, tampered with or not ours. */
export function readCalendarState(token: unknown): CalendarState | null {
  if (typeof token !== "string" || !token) return null;
  try {
    const s = jwt.verify(token, env.jwtSecret) as Partial<CalendarState> & { purpose?: string };
    if (s.purpose !== "connect-calendar") return null;
    if (typeof s.organizationId !== "string" || typeof s.userId !== "string" || typeof s.roleSlug !== "string") return null;
    return { organizationId: s.organizationId, userId: s.userId, roleSlug: s.roleSlug };
  } catch {
    return null;
  }
}

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

  // The callback is unauthenticated (it's a redirect from Google), so `state` has to say who is
  // connecting: which workspace the calendar belongs to, and which /[role]/settings/... URL to
  // land back on. Signed and short-lived so nobody can point a callback at someone else's
  // workspace (the same approach as Settings → Accounts, services/connectedAccounts.ts).
  const state = signCalendarState({
    organizationId: req.user!.organizationId,
    userId: req.user!.userId,
    roleSlug: req.user!.roleSlug,
  });
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

  const claims = readCalendarState(state);
  const settingsUrl = `${frontendUrl}/${claims?.roleSlug || "superadmin"}/settings/google-calendar`;

  // Without a valid state there is no workspace to attach a calendar to.
  if (!claims) {
    res.redirect(`${settingsUrl}?error=invalid_state`);
    return;
  }
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
    // GoogleCalendarToken is tenant-owned, and this request has no login to supply the
    // tenant, so the workspace from the signed state is entered explicitly. That also makes
    // "the previous token" and the deactivation below mean THIS workspace's, never another's.
    const saved = await runForOrg(
      claims.organizationId,
      async () => {
        const previous = await getActiveCalendarToken();
        const refreshToken = tokens.refresh_token || previous?.refreshToken;
        if (!refreshToken) return false;

        await GoogleCalendarToken.update({ isActive: false }, { where: { isActive: true } });
        await GoogleCalendarToken.create({
          refreshToken,
          accessToken: tokens.access_token ?? null,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          connectedEmail: profile.email ?? null,
          calendarId: "primary",
          isActive: true,
        });
        return true;
      },
      { userId: claims.userId, label: "connect-calendar" }
    );
    if (!saved) {
      res.redirect(`${settingsUrl}?error=no_refresh_token`);
      return;
    }

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
