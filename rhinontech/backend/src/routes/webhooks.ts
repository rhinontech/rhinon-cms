import { Router, Request, Response } from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { simpleParser } from "mailparser";
import { Op } from "sequelize";
import { InboxEmail, Lead, CampaignActivity, Activity } from "../models";
import { stopEnrollmentsForLead } from "../services/workflowEngine";
import { uploadBuffer } from "../services/storage";
import { env } from "../config/env";
import { resolveInboundRecipient, InboundTarget } from "../services/inboundRouting";
import { verifySnsMessage, isSnsUrl } from "../services/snsVerify";
import { runForOrg } from "../services/tenantContext";

const router = Router();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

router.post("/ses-inbound", async (req: Request, res: Response) => {
  try {
    const payloadType = req.headers["x-amz-sns-message-type"];
    let snsBody = req.body;

    if (typeof snsBody === "string") {
      try {
        snsBody = JSON.parse(snsBody);
      } catch {
        res.status(400).send("Invalid body");
        return;
      }
    }
    if (!snsBody || typeof snsBody !== "object") {
      res.status(400).send("Invalid body");
      return;
    }

    // Nothing below may run for a message we cannot prove came from our own SNS
    // topic: this URL is public, and what follows fetches an S3 object and files
    // it into a tenant's inbox.
    const verdict = await verifySnsMessage(snsBody);
    if (!verdict.ok) {
      console.warn(`[Webhook] Rejected SNS message: ${verdict.reason}`);
      res.status(403).send("Forbidden");
      return;
    }

    // 1. Handle SNS Subscription Confirmation
    if (payloadType === "SubscriptionConfirmation") {
      // Signature and topic are verified above; still only follow a real SNS URL.
      if (isSnsUrl(snsBody.SubscribeURL)) {
        try {
          const response = await fetch(snsBody.SubscribeURL);
          console.log(response.ok ? "[Webhook] SNS subscription confirmed" : `[Webhook] SNS confirmation failed: ${response.statusText}`);
        } catch (err) {
          console.error("[Webhook] Error confirming SNS subscription:", err);
        }
      }
      res.status(200).send("OK");
      return;
    }

    // 2. Handle Notification
    if (payloadType === "Notification") {
      const message = JSON.parse(snsBody.Message);
      const mail = message.mail;
      const receipt = message.receipt;

      if (!mail || !receipt) {
        res.status(400).send("Invalid SES payload");
        return;
      }

      // Find the S3 action details
      const s3Action = receipt.action;
      if (s3Action && s3Action.type === "S3") {
        const bucketName = s3Action.bucketName;
        const objectKey = s3Action.objectKey;

        // Belt and braces on top of the topic allowlist: only read from the
        // bucket SES is configured to deliver into.
        const inboundBucket = process.env.SES_INBOUND_BUCKET;
        if (inboundBucket && bucketName !== inboundBucket) {
          console.warn(`[Webhook] Ignoring inbound mail from unexpected bucket ${bucketName}`);
          res.status(200).send("OK");
          return;
        }

        // Fetch the raw email from S3
        const getRes = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
          })
        );

        const rawEml = await getRes.Body?.transformToString();
        if (!rawEml) {
          throw new Error("Empty body from S3");
        }

        const parsed = await simpleParser(rawEml);

        // Map parsed data to InboxEmail
        const messageId = parsed.messageId || objectKey;
        const fromEmail = (parsed.from as any)?.value?.[0]?.address || mail.source;
        const fromName = parsed.from?.text?.replace(/<[^>]*>?/gm, '').replace(/["']/g, '').trim() || fromEmail;
        const toEmails = Array.isArray(parsed.to) 
          ? parsed.to.flatMap(t => (t as any).value.map((v: any) => v.address)) 
          : (parsed.to as any)?.value?.map((v: any) => v.address) || mail.destination;
        
        const ccEmails = parsed.cc ? (Array.isArray(parsed.cc) 
          ? parsed.cc.flatMap(t => (t as any).value.map((v: any) => v.address)) 
          : (parsed.cc as any)?.value?.map((v: any) => v.address)) : [];

        const subject = parsed.subject || "(No Subject)";
        const htmlBody = parsed.html || parsed.textAsHtml || parsed.text || "";
        const snippet = parsed.text ? parsed.text.substring(0, 160) : "";

        // The recipient decides the workspace. SES hands us every tenant's mail
        // through one catch-all, so each address is resolved to an organization
        // and mail for an address we do not own is dropped, not filed.
        const targets = new Map<string, InboundTarget>();
        for (const recipient of new Set<string>(toEmails.concat(ccEmails).map((r: string) => (r || "").toLowerCase()))) {
          const target = await resolveInboundRecipient(recipient);
          if (target) targets.set(recipient, target);
        }
        if (targets.size === 0) {
          console.warn(`[Webhook] Dropped inbound mail for ${toEmails.join(", ")}: no matching workspace`);
          res.status(200).send("OK");
          return;
        }

        // One pass per workspace, each inside its own tenant context so threading,
        // lead lookup and every write are scoped to that organization alone.
        const byOrg = new Map<string, InboundTarget[]>();
        for (const target of targets.values()) {
          byOrg.set(target.organizationId, [...(byOrg.get(target.organizationId) ?? []), target]);
        }

        for (const [organizationId, orgTargets] of byOrg) {
          await runForOrg(organizationId, async () => {
            // Attachments are stored per workspace so each copy lives under its
            // own tenant prefix.
            const attachments: { key: string; name: string; size: number; mimeType: string }[] = [];
            for (const att of parsed.attachments ?? []) {
              try {
                const name = att.filename || "attachment";
                const key = await uploadBuffer(att.content, name, "inbox", att.contentType || "application/octet-stream");
                attachments.push({ key, name, size: att.content.length, mimeType: att.contentType || "application/octet-stream" });
              } catch (err) {
                console.error("Failed to store inbound attachment:", err);
              }
            }

            // Thread replies into the original conversation: an inbound reply's
            // In-Reply-To/References point at messageIds we've already stored.
            const inReplyTo = parsed.inReplyTo || null;
            const refIds = [
              ...(inReplyTo ? [inReplyTo] : []),
              ...(Array.isArray(parsed.references) ? parsed.references : parsed.references ? [parsed.references] : []),
            ];
            let threadKey = messageId;
            if (refIds.length) {
              const parent = await InboxEmail.findOne({
                where: { [Op.or]: [{ messageId: { [Op.in]: refIds } }, { threadKey: { [Op.in]: refIds } }] },
              });
              if (parent) threadKey = parent.threadKey;
            }
            // Fallback: replies to OUR outbound mail carry the transport's own
            // Message-ID (which we never see with SES Simple), so also match by
            // normalized subject — within this workspace only.
            if (threadKey === messageId && subject) {
              const bare = subject.replace(/^((re|fwd?)\s*:\s*)+/i, "").trim();
              if (bare) {
                const escaped = bare.replace(/[\\%_]/g, (c: string) => `\\${c}`);
                const parent = await InboxEmail.findOne({
                  where: { subject: { [Op.iLike]: `%${escaped}%` } },
                  order: [["sentAt", "DESC"]],
                });
                if (parent) threadKey = parent.threadKey;
              }
            }

            // If this inbound email came from a known lead, tag it to their campaign
            // so the campaign gets its own inbox — this is what a reply belongs to.
            const repliedLead = await Lead.findOne({ where: { email: fromEmail.toLowerCase() } });

            for (const target of orgTargets) {
              // SNS delivers at-least-once; a redelivery must not double-file.
              const already = await InboxEmail.findOne({
                where: { messageId, ownerEmail: target.address },
                attributes: ["id"],
              });
              if (already) continue;

              await InboxEmail.create({
                threadKey,
                folder: "inbox",
                ownerEmail: target.address,
                fromName: fromName,
                fromEmail: fromEmail,
                toEmails: toEmails,
                ccEmails: ccEmails,
                subject: subject,
                body: htmlBody,
                snippet: snippet,
                isRead: false,
                isStarred: false,
                hasAttachment: attachments.length > 0,
                attachments,
                messageId,
                inReplyTo,
                campaignId: repliedLead?.campaignId ?? null,
                leadId: repliedLead?.id ?? null,
                // Who it was addressed to decides the brand: mail to
                // hello@uppercurve.in is Uppercurve's whether or not we know the
                // sender. The replying lead's brand is the fallback.
                siteId: target.siteId ?? repliedLead?.siteId ?? null,
                sentAt: parsed.date || new Date(),
              });
            }

            // Surface it as a reply inside their campaign — flips status to Replied
            // and logs the activity the campaign's Activity feed / funnel already render.
            if (repliedLead && !["Bounced", "Unsubscribed"].includes(repliedLead.status)) {
              await repliedLead.update({ status: "Replied", lastActivityAt: new Date() });
              await CampaignActivity.create({
                leadId: repliedLead.id,
                campaignId: repliedLead.campaignId,
                type: "ReplyReceived",
                content: snippet || `${fromName} replied to your outreach email.`,
                generatedContent: htmlBody,
              });

              // A reply ends the sequence. Without this, scheduled follow-ups keep
              // firing at someone who has already written back.
              const stopped = await stopEnrollmentsForLead(repliedLead.id, "Lead replied");
              if (stopped > 0) {
                console.log(`[Webhook] Reply from ${repliedLead.email} exited ${stopped} sequence(s).`);
              }

              // Mirror it onto the CRM timeline so the reply is visible next to
              // calls and notes, not only inside the campaign view.
              await Activity.create({
                leadId: repliedLead.id,
                accountId: repliedLead.accountId,
                type: "Email",
                direction: "Inbound",
                subject: subject || `Reply from ${fromName}`,
                body: snippet || null,
                metadata: { source: "reply-webhook", campaignId: repliedLead.campaignId },
              });
            }
          }, { label: "ses-inbound" });
        }
      }
      res.status(200).send("OK");
      return;
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
