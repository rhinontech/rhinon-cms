import { Router, Request, Response } from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { simpleParser } from "mailparser";
import { Op } from "sequelize";
import { InboxEmail, Lead, CampaignActivity, Activity } from "../models";
import { stopEnrollmentsForLead } from "../services/workflowEngine";
import { uploadBuffer } from "../services/storage";
import { env } from "../config/env";

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
      snsBody = JSON.parse(snsBody);
    }

    // 1. Handle SNS Subscription Confirmation
    if (payloadType === "SubscriptionConfirmation") {
      const subscribeUrl = snsBody.SubscribeURL;
      console.log("SNS Subscription URL received, auto-confirming...");
      
      try {
        const response = await fetch(subscribeUrl);
        if (response.ok) {
          console.log("Successfully auto-confirmed SNS subscription!");
        } else {
          console.error("Failed to auto-confirm:", response.statusText);
        }
      } catch (err) {
        console.error("Error auto-confirming SNS:", err);
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

        // Store attachments to S3 once; every recipient copy shares the keys.
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
        // normalized subject against the sender's conversation.
        if (threadKey === messageId && subject) {
          const bare = subject.replace(/^((re|fwd?)\s*:\s*)+/i, "").trim();
          if (bare) {
            const parent = await InboxEmail.findOne({
              where: { subject: { [Op.iLike]: `%${bare}%` } },
              order: [["sentAt", "DESC"]],
            });
            if (parent) threadKey = parent.threadKey;
          }
        }

        // If this inbound email came from a known lead, tag it to their campaign
        // so the campaign gets its own inbox — this is what a reply belongs to.
        const repliedLead = await Lead.findOne({ where: { email: fromEmail.toLowerCase() } });

        // SES can send emails to multiple recipients in our domain.
        // We should create a copy in the inbox for each valid internal recipient.
        for (const recipient of toEmails) {
          await InboxEmail.create({
            threadKey,
            folder: "inbox",
            ownerEmail: recipient.toLowerCase(),
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
