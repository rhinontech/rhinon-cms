import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { simpleParser } from "mailparser";

// We require AWS credentials to be set
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const INBOX_BUCKET = process.env.AWS_S3_INBOX_BUCKET;

const isAwsConfigured = process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && INBOX_BUCKET;

export async function uploadToS3(bucket: string, key: string, body: Buffer | string, contentType: string) {
  if (!isAwsConfigured) return null;
  await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
  return key;
}

export async function getObjectFromS3(bucket: string, key: string) {
  if (!isAwsConfigured) return null;
  try {
    return await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  } catch (e) {
    console.error(`S3 Get Error [${key}]:`, e);
    return null;
  }
}

export async function saveEmailToS3(userEmail: string, type: "inbound" | "outbound", messageId: string, rawEml: string) {
  if (!isAwsConfigured) {
    console.warn("AWS S3 not configured. Skipping save to S3.");
    return null;
  }
  const key = `emails/${userEmail}/${type}/${messageId}.eml`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: INBOX_BUCKET,
      Key: key,
      Body: rawEml,
      ContentType: "message/rfc822",
    })
  );

  return key;
}

export async function fetchUserEmailsFromS3(userEmail: string) {
  if (!isAwsConfigured) {
    console.warn("AWS S3 not configured. Returning empty inbox stream.");
    return [];
  }

  const prefix = `emails/${userEmail}/`;
  const results: any[] = [];

  try {
    // 1. Try structured folder first
    const listRes = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: INBOX_BUCKET,
        Prefix: prefix,
      })
    );

    if (listRes.Contents && listRes.Contents.length > 0) {
      const sorted = listRes.Contents.sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0)).slice(0, 50);
      results.push(...(await parseObjects(sorted)));
    }

    // 2. Fallback: Scan root for raw SES objects (usually no prefix)
    // We only do this if results are low or to find "loose" emails
    if (results.length < 10) {
      const rootList = await s3Client.send(new ListObjectsV2Command({
        Bucket: INBOX_BUCKET,
        Delimiter: "/", // only root
        MaxKeys: 40,
      }));

      if (rootList.Contents) {
        // Filter out AWS setup notifications and already processed folders
        const rawObjects = rootList.Contents
          .filter(obj => !obj.Key?.includes("/") && obj.Key !== "AMAZON_SES_SETUP_NOTIFICATION")
          .sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0))
          .slice(0, 20);

        const rawParsed = await parseObjects(rawObjects, userEmail);
        results.push(...rawParsed);
      }
    }

    // Final Sort
    return results
      .filter(Boolean)
      .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
  } catch (error) {
    console.error("S3 Fetch Error:", error);
    return [];
  }
}

async function parseObjects(objects: any[], filterEmail?: string) {
  return Promise.all(
    objects.map(async (obj) => {
      try {
        const getRes = await s3Client.send(new GetObjectCommand({
          Bucket: INBOX_BUCKET,
          Key: obj.Key!,
        }));

        const rawEml = await getRes.Body?.transformToString();
        if (!rawEml) return null;

        const parsed = await simpleParser(rawEml);

        // If filterEmail is provided, ensure this email is actually for them
        if (filterEmail) {
          const toString = parsed.to ? (Array.isArray(parsed.to) ? parsed.to.map(t => t.text).join(" ") : parsed.to.text) : "";
          const ccString = parsed.cc ? (Array.isArray(parsed.cc) ? parsed.cc.map(t => t.text).join(" ") : parsed.cc.text) : "";

          if (!toString.toLowerCase().includes(filterEmail.toLowerCase()) &&
            !ccString.toLowerCase().includes(filterEmail.toLowerCase())) {
            return null;
          }
        }

        return {
          _id: obj.Key,
          messageId: parsed.messageId || obj.Key,
          from: parsed.from?.text || "Unknown Sender",
          fromEmail: (parsed.from as any)?.value?.[0]?.address || "",
          to: (Array.isArray(parsed.to) ? (parsed.to as any)[0]?.text : (parsed.to as any)?.text) || filterEmail || "",
          subject: parsed.subject || "(no subject)",
          snippet: parsed.text ? parsed.text.substring(0, 100) : "",
          htmlBody: parsed.html || parsed.textAsHtml || "",
          receivedAt: obj.LastModified || new Date(),
          direction: obj.Key?.includes("/outbound/") ? "outbound" : "inbound",
        };
      } catch (e) {
        console.error(`Failed to parse S3 email ${obj.Key}:`, e);
        return null;
      }
    })
  );
}
