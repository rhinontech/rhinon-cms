import { Router, Request, Response } from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { simpleParser } from "mailparser";
import { InboxEmail } from "../models";
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
        const fromName = parsed.from?.text?.replace(/<[^>]*>?/gm, '').trim() || fromEmail;
        const toEmails = Array.isArray(parsed.to) 
          ? parsed.to.flatMap(t => (t as any).value.map((v: any) => v.address)) 
          : (parsed.to as any)?.value?.map((v: any) => v.address) || mail.destination;
        
        const ccEmails = parsed.cc ? (Array.isArray(parsed.cc) 
          ? parsed.cc.flatMap(t => (t as any).value.map((v: any) => v.address)) 
          : (parsed.cc as any)?.value?.map((v: any) => v.address)) : [];

        const subject = parsed.subject || "(No Subject)";
        const htmlBody = parsed.html || parsed.textAsHtml || parsed.text || "";
        const snippet = parsed.text ? parsed.text.substring(0, 160) : "";

        // SES can send emails to multiple recipients in our domain.
        // We should create a copy in the inbox for each valid internal recipient.
        for (const recipient of toEmails) {
          // You might want to filter this to only your domain, e.g. if (recipient.endsWith('@rhinontech.in'))
          await InboxEmail.create({
            threadKey: messageId, // Might want to parse In-Reply-To for better threading
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
            hasAttachment: parsed.attachments.length > 0,
            sentAt: parsed.date || new Date(),
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
