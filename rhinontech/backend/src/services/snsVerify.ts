import crypto from "crypto";
import { isDevOrTest } from "../config/env";

/**
 * Authenticates an inbound Amazon SNS message.
 *
 * /webhooks/ses-inbound is an unauthenticated public URL, so without this anyone
 * could POST a forged "SES notification" and have the server fetch an S3 object
 * and file it into a tenant's inbox. Two separate checks are needed and neither
 * is enough alone:
 *
 *   1. The signature proves the message came from SNS and was not altered.
 *   2. The topic allowlist proves it came from OUR topic — any AWS account can
 *      create a topic and SNS will sign its messages just as validly.
 *
 * Follows https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
 */

const CERT_HOST = /^sns\.[a-z0-9-]+\.amazonaws\.com(\.cn)?$/;

const certCache = new Map<string, { pem: string; at: number }>();
const CERT_TTL_MS = 6 * 60 * 60 * 1000;

const SIGNED_FIELDS: Record<string, string[]> = {
  Notification: ["Message", "MessageId", "Subject", "Timestamp", "TopicArn", "Type"],
  SubscriptionConfirmation: ["Message", "MessageId", "SubscribeURL", "Timestamp", "Token", "TopicArn", "Type"],
  UnsubscribeConfirmation: ["Message", "MessageId", "SubscribeURL", "Timestamp", "Token", "TopicArn", "Type"],
};

/** True for https URLs on a genuine SNS regional endpoint. */
export function isSnsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && CERT_HOST.test(url.hostname);
  } catch {
    return false;
  }
}

async function signingCert(url: string): Promise<string> {
  const hit = certCache.get(url);
  if (hit && Date.now() - hit.at < CERT_TTL_MS) return hit.pem;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch SNS signing certificate (${res.status})`);
  const pem = await res.text();
  certCache.set(url, { pem, at: Date.now() });
  return pem;
}

/** Topic ARNs we accept messages from: SNS_ALLOWED_TOPIC_ARNS, comma separated. */
export function allowedTopicArns(): string[] {
  return (process.env.SNS_ALLOWED_TOPIC_ARNS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type SnsVerdict = { ok: true } | { ok: false; reason: string };

export async function verifySnsMessage(body: Record<string, any>): Promise<SnsVerdict> {
  const type = body?.Type;
  const fields = SIGNED_FIELDS[type];
  if (!fields) return { ok: false, reason: `unsupported message type ${String(type)}` };

  // Topic allowlist first: cheap, and it runs before any network fetch.
  const allowed = allowedTopicArns();
  if (allowed.length === 0) {
    // Fail closed everywhere but local development — an open endpoint is the
    // vulnerability this file exists to close.
    if (!isDevOrTest) {
      return { ok: false, reason: "SNS_ALLOWED_TOPIC_ARNS is not configured" };
    }
  } else if (!allowed.includes(body.TopicArn)) {
    return { ok: false, reason: `topic ${String(body.TopicArn)} is not allowed` };
  }

  if (body.SignatureVersion !== "1" && body.SignatureVersion !== "2") {
    return { ok: false, reason: "unsupported SignatureVersion" };
  }
  if (!body.Signature || !isSnsUrl(body.SigningCertURL) || !String(body.SigningCertURL).endsWith(".pem")) {
    return { ok: false, reason: "missing signature or untrusted SigningCertURL" };
  }

  let stringToSign = "";
  for (const name of fields) {
    // Subject is the one optional field; it is only signed when present.
    if (body[name] === undefined || body[name] === null) {
      if (name === "Subject") continue;
      return { ok: false, reason: `missing ${name}` };
    }
    stringToSign += `${name}\n${body[name]}\n`;
  }

  try {
    const pem = await signingCert(body.SigningCertURL);
    const verifier = crypto.createVerify(body.SignatureVersion === "2" ? "RSA-SHA256" : "RSA-SHA1");
    verifier.update(stringToSign, "utf8");
    const valid = verifier.verify(pem, String(body.Signature), "base64");
    return valid ? { ok: true } : { ok: false, reason: "signature mismatch" };
  } catch (err: any) {
    return { ok: false, reason: `verification error: ${err.message}` };
  }
}
