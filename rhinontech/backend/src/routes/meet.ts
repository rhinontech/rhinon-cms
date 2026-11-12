import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../config/env";
import { runAsSystem } from "../services/tenantContext";
import { iceServersFor } from "../services/turnCredentials";
import { findUsableLink } from "../services/teamChat/service";
import { TeamChatConversation } from "../models/TeamChat";
import { Organization } from "../models/Organization";
import { User } from "../models/User";

/**
 * Public meeting links: /public/meet/:token. No account — a guest gets a
 * short-lived token that only works on the call socket for that one chat
 * (purpose "call-guest"; authenticate() refuses any token with a purpose, so it
 * can never open the API). Nothing here reveals the chat's messages or members.
 */
const router = Router();

export const GUEST_TOKEN_PURPOSE = "call-guest";

async function resolve(token: string) {
  return runAsSystem("meet:resolve", async () => {
    const link = await findUsableLink(token);
    if (!link) return null;
    const orgId = link.get("organizationId") as string;
    const [conv, org, host] = await Promise.all([
      TeamChatConversation.unscoped().findByPk(link.conversationId, { attributes: ["kind", "name"] }),
      Organization.findByPk(orgId, { attributes: ["name", "status"] }),
      User.unscoped().findByPk(link.createdById, { attributes: ["fullName"] }),
    ]);
    if (!conv || !org || org.status === "suspended") return null;
    const title = conv.kind === "direct" || !conv.name ? `Meeting with ${host?.fullName ?? "the team"}` : conv.name;
    return { link, orgId, orgName: org.name, title };
  });
}

router.get("/:token", async (req: Request, res: Response) => {
  const found = await resolve(req.params.token).catch(() => null);
  if (!found) {
    res.status(404).json({ message: "This meeting link is invalid or has expired." });
    return;
  }
  res.json({ title: found.title, orgName: found.orgName, requireApproval: found.link.requireApproval });
});

router.post("/:token/join", async (req: Request, res: Response) => {
  const name = typeof req.body?.name === "string" ? req.body.name.replace(/\s+/g, " ").trim().slice(0, 60) : "";
  if (name.length < 2) {
    res.status(400).json({ message: "Enter your name to join." });
    return;
  }
  const found = await resolve(req.params.token).catch(() => null);
  if (!found) {
    res.status(404).json({ message: "This meeting link is invalid or has expired." });
    return;
  }
  const guestId = crypto.randomUUID();
  const guestToken = jwt.sign(
    { purpose: GUEST_TOKEN_PURPOSE, linkToken: req.params.token, guestId, name },
    env.jwtSecret,
    { expiresIn: "8h" }
  );
  res.json({ guestToken, guestId: `guest:${guestId}`, title: found.title, iceServers: iceServersFor(`guest-${guestId.slice(0, 8)}`) });
});

export default router;
