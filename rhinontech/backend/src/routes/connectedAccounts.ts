import { Router, type Request, type Response } from "express";
import { authenticate, type AuthRequest } from "../middleware/authenticate";
import { ConnectedAccount } from "../models/ConnectedAccount";
import { User } from "../models/User";
import { cleanPreferences } from "../services/emailIdentity";
import { runForOrg } from "../services/tenantContext";
import {
  PROVIDERS,
  callbackUrl,
  connectAccount,
  consentUrl,
  isConfigured,
  parseProvider,
  publicAccount,
  readState,
} from "../services/connectedAccounts";

/**
 * Settings → Accounts. Each person connects their own Gmail / Outlook; nobody
 * can see or use anyone else's. Tokens never leave the server.
 */
const router = Router();
const frontendUrl = () => process.env.FRONTEND_URL || "http://localhost:4200";

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const [accounts, me] = await Promise.all([
    ConnectedAccount.findAll({ where: { userId: req.user!.userId } }),
    User.findByPk(req.user!.userId, { attributes: ["id", "companyEmail", "emailPreferences"] }),
  ]);
  res.json({
    providers: PROVIDERS.map((provider) => ({ provider, configured: isConfigured(provider), redirectUri: callbackUrl(provider) })),
    accounts: accounts.map(publicAccount),
    platformEmail: me?.companyEmail ?? null,
    preferences: cleanPreferences(me?.emailPreferences),
  });
});

/**
 * PUT /integrations/accounts/preferences — which address each module sends from.
 * Only "platform" or a provider this person has actually connected is accepted.
 */
router.put("/preferences", authenticate, async (req: AuthRequest, res: Response) => {
  const wanted = cleanPreferences(req.body?.preferences);
  const connected = new Set((await ConnectedAccount.findAll({ where: { userId: req.user!.userId }, attributes: ["provider"] })).map((a) => a.provider));
  for (const [module, choice] of Object.entries(wanted)) {
    if (choice !== "platform" && !connected.has(choice)) {
      return void res.status(400).json({ message: `Connect ${choice === "GOOGLE" ? "Google" : "Microsoft"} first to use it for ${module}.` });
    }
  }
  const me = await User.findByPk(req.user!.userId);
  if (!me) return void res.status(404).json({ message: "User not found" });
  await me.update({ emailPreferences: { ...cleanPreferences(me.emailPreferences), ...wanted } });
  res.json({ preferences: cleanPreferences(me.emailPreferences) });
});

router.get("/:provider/auth", authenticate, (req: AuthRequest, res: Response) => {
  const provider = parseProvider(req.params.provider);
  if (!provider) return void res.status(404).json({ message: "Unknown provider" });
  if (!isConfigured(provider)) return void res.status(400).json({ message: `${provider === "GOOGLE" ? "Google" : "Microsoft"} isn't set up on the server yet.` });
  res.json({
    authUrl: consentUrl({
      userId: req.user!.userId,
      organizationId: req.user!.organizationId,
      provider,
      returnTo: `/${req.user!.roleSlug}/settings/accounts`,
    }),
  });
});

// The provider's redirect. Unauthenticated by necessity; the signed state says who.
router.get("/:provider/callback", async (req: Request, res: Response) => {
  const provider = parseProvider(req.params.provider);
  const state = readState(String(req.query.state ?? ""));
  if (!provider || !state || state.provider !== provider) return void res.redirect(`${frontendUrl()}/?accountError=invalid_state`);
  const back = `${frontendUrl()}${state.returnTo.startsWith("/") ? state.returnTo : "/"}`;
  if (req.query.error || !req.query.code) return void res.redirect(`${back}?error=${encodeURIComponent(String(req.query.error || "missing_code"))}`);
  try {
    await runForOrg(state.organizationId, () => connectAccount(provider, state.userId, String(req.query.code)), { userId: state.userId, label: "connect-account" });
    res.redirect(`${back}?connected=${provider.toLowerCase()}`);
  } catch (err: any) {
    console.error(`[Accounts] ${provider} connect failed:`, err?.message || err);
    res.redirect(`${back}?error=auth_failed`);
  }
});

router.delete("/:provider", authenticate, async (req: AuthRequest, res: Response) => {
  const provider = parseProvider(req.params.provider);
  if (!provider) return void res.status(404).json({ message: "Unknown provider" });
  await ConnectedAccount.destroy({ where: { userId: req.user!.userId, provider } });
  // Anything that was set to send through it goes back to the platform address.
  const me = await User.findByPk(req.user!.userId);
  if (me?.emailPreferences) {
    const prefs = cleanPreferences(me.emailPreferences);
    for (const m of Object.keys(prefs) as (keyof typeof prefs)[]) if (prefs[m] === provider) prefs[m] = "platform";
    await me.update({ emailPreferences: prefs });
  }
  res.json({ success: true });
});

export default router;
