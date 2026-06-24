import { Router, Response } from "express";
import { User } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { env } from "../config/env";

const router = Router();

router.use(authenticate, authorize("provisioning:read"));

router.post("/:id/slack", authorize("provisioning:write"), async (req: AuthRequest, res: Response) => {
  const employee = await User.findByPk(req.params.id);
  if (!employee) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }

  if (!env.slack.botToken) {
    res.status(503).json({ message: "Slack integration not configured" });
    return;
  }

  const slackRes = await fetch("https://slack.com/api/users.admin.invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.slack.botToken}`,
    },
    body: JSON.stringify({ email: employee.personalEmail }),
  });

  const slackData = await slackRes.json() as { ok: boolean; error?: string };

  if (!slackData.ok) {
    res.status(400).json({ message: `Slack invite failed: ${slackData.error}` });
    return;
  }

  res.json({ message: "Slack invite sent", email: employee.personalEmail });
});

router.post("/:id/github", authorize("provisioning:write"), async (req: AuthRequest, res: Response) => {
  const employee = await User.findByPk(req.params.id);
  if (!employee) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }

  if (!env.github.token || !env.github.org) {
    res.status(503).json({ message: "GitHub integration not configured" });
    return;
  }

  const { githubUsername } = req.body;
  if (!githubUsername) {
    res.status(400).json({ message: "githubUsername is required" });
    return;
  }

  const ghRes = await fetch(
    `https://api.github.com/orgs/${env.github.org}/invitations`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${env.github.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ invitee_id: githubUsername }),
    }
  );

  if (!ghRes.ok) {
    const err = await ghRes.json() as { message: string };
    res.status(400).json({ message: `GitHub invite failed: ${err.message}` });
    return;
  }

  res.json({ message: "GitHub org invite sent", username: githubUsername });
});

export default router;
