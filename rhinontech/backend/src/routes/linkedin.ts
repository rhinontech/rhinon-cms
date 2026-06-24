import { Router, Request, Response } from "express";
import axios from "axios";
import { LinkedInToken } from "../models/LinkedInToken";
import { Campaign } from "../models/Campaign";
import {
  getLinkedInConnectionStatus,
  getLinkedInPostStats,
  getLinkedInOrganizations,
} from "../services/linkedin";
import { authenticate, AuthRequest } from "../middleware/authenticate";

const router = Router();

// GET /linkedin/auth — generate OAuth URL
router.get("/auth", (_req: Request, res: Response) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    res.status(500).json({ error: "LinkedIn credentials not configured" });
    return;
  }

  const scope = encodeURIComponent("openid profile email w_member_social");
  const state = Buffer.from(JSON.stringify({ timestamp: Date.now() })).toString("base64");
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;

  res.json({ authUrl });
});

// GET /linkedin/callback — OAuth callback (redirect from LinkedIn)
router.get("/callback", async (req: Request, res: Response) => {
  const { code, error, error_description } = req.query as Record<string, string>;
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:4200";

  if (error) {
    res.redirect(`${baseUrl}/outreach?error=${error}&message=${error_description}`);
    return;
  }

  if (!code) {
    res.redirect(`${baseUrl}/outreach?error=missing_code`);
    return;
  }

  try {
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token, expires_in, refresh_token } = tokenResponse.data;

    const profileResponse = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const linkedinProfile = profileResponse.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Deactivate old tokens
    await LinkedInToken.update({ isActive: false }, { where: { isActive: true } });

    await LinkedInToken.create({
      accessToken: access_token,
      refreshToken: refresh_token || null,
      expiresAt,
      linkedinUserId: linkedinProfile.sub,
      linkedinProfileData: linkedinProfile,
      isActive: true,
    });

    res.redirect(`${baseUrl}/outreach?linkedin=connected`);
  } catch (err: any) {
    console.error("LinkedIn Callback Error:", err.response?.data || err);
    res.redirect(`${baseUrl}/outreach?error=auth_failed&message=${encodeURIComponent(err.message)}`);
  }
});

// POST /linkedin/disconnect
router.post("/disconnect", authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await LinkedInToken.update({ isActive: false }, { where: { isActive: true } });
    res.json({ success: true, message: "LinkedIn disconnected successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /linkedin/status
router.get("/status", authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const status = await getLinkedInConnectionStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /linkedin/organizations — list company pages the connected user administers
router.get("/organizations", authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const orgs = await getLinkedInOrganizations();
    res.json(orgs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /linkedin/campaigns/:id/stats — fetch live LinkedIn post stats
router.get("/campaigns/:id/stats", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    let stats = { likes: 0, comments: 0, shares: 0, impressions: 0, lastUpdated: new Date() };

    if (campaign.platformPostId) {
      try {
        const freshStats = await getLinkedInPostStats(campaign.platformPostId);
        stats = { ...stats, ...freshStats };
        await campaign.update({ socialStats: { ...stats, lastUpdated: new Date().toISOString() } });
      } catch (err) {
        console.error("LinkedIn Stats Fetch Error:", err);
      }
    }

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
