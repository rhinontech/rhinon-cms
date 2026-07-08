import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;
const REGION = process.env.AWS_REGION || "ap-south-1";

// Fixed key — a single company signature, overwritten on re-upload. Used to sign
// relieving/experience letters (services/letters.ts) once uploaded via /branding.
export const SIGNATURE_KEY = "branding/signature.png";

// Stable, permanent S3 URL for objects under a publicly-readable prefix (e.g. content/).
export function publicUrl(key: string): string {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

export async function getPresignedReadUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}

export async function uploadBuffer(
  buffer: Buffer,
  originalName: string,
  folder: "avatars" | "documents" | "content",
  mimeType: string
): Promise<string> {
  const ext = path.extname(originalName) || "";
  const key = `${folder}/${crypto.randomUUID()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return key;
}

export async function getPresignedUploadUrl(
  folder: "avatars" | "documents",
  filename: string,
  mimeType: string,
  expiresIn = 300
): Promise<{ uploadUrl: string; key: string }> {
  const ext = path.extname(filename) || "";
  const key = `${folder}/${crypto.randomUUID()}${ext}`;

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: mimeType }),
    { expiresIn }
  );
  return { uploadUrl, key };
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

// Upload to a fixed, caller-chosen key (overwrites) — for singleton assets like
// a company signature, as opposed to uploadBuffer's random per-upload keys.
export async function uploadFixedObject(key: string, buffer: Buffer, mimeType: string): Promise<string> {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: mimeType }));
  return key;
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export async function getObjectBuffer(key: string): Promise<Buffer | null> {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const bytes = await res.Body?.transformToByteArray();
    return bytes ? Buffer.from(bytes) : null;
  } catch {
    return null;
  }
}
