import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";
import { currentOrganizationId, runAsSystem } from "./tenantContext";
import { Organization } from "../models/Organization";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;
const REGION = process.env.AWS_REGION || "ap-south-1";

/**
 * Object keys are namespaced per workspace: `<folder>/<organizationId>/<uuid>.<ext>`.
 *
 * The UUID alone is unguessable, but a namespace is what makes the rest possible:
 * exporting or deleting one tenant's files is a prefix operation, and any key a
 * client hands back to us can be checked against the caller's own prefix instead
 * of being trusted. Keys written before this change have no org segment
 * (`<folder>/<uuid>.<ext>`); they all belong to the platform workspace, which was
 * the only one that existed, and isOwnKey() treats them that way.
 */
function namespacedKey(folder: string, ext: string): string {
  const orgId = currentOrganizationId();
  return orgId
    ? `${folder}/${orgId}/${crypto.randomUUID()}${ext}`
    : `${folder}/${crypto.randomUUID()}${ext}`;
}

let platformOrgId: string | null | undefined;
async function isPlatformOrg(orgId: string): Promise<boolean> {
  if (platformOrgId === undefined) {
    const org = await runAsSystem("storage:platform-org", () =>
      Organization.findOne({ where: { isPlatform: true }, attributes: ["id"] })
    );
    platformOrgId = org?.id ?? null;
  }
  return platformOrgId === orgId;
}

/**
 * Whether the calling workspace may touch `key`. Use this on any key that
 * arrives in a request body — never presign, read or attach a client-supplied
 * key without it, or the request becomes a read oracle over other tenants' files.
 */
export async function isOwnKey(key: unknown): Promise<boolean> {
  const orgId = currentOrganizationId();
  if (typeof key !== "string" || !orgId || key.includes("..")) return false;
  const parts = key.split("/");
  if (parts.length === 3) return parts[1] === orgId;
  if (parts.length === 2) return isPlatformOrg(orgId); // legacy, pre-namespacing
  return false;
}

// Company signature used to sign relieving/experience letters (services/letters.ts),
// uploaded via /branding. One per workspace — this used to be a single global key,
// so one tenant's upload replaced every other tenant's signature on their letters.
const LEGACY_SIGNATURE_KEY = "branding/signature.png";

export function signatureKey(): string {
  const orgId = currentOrganizationId();
  if (!orgId) throw new Error("signatureKey() needs a tenant context");
  return `branding/${orgId}/signature.png`;
}

/** The workspace's own signature key if present, else the legacy one for the platform org. */
export async function resolveSignatureKey(): Promise<string | null> {
  const own = signatureKey();
  if (await objectExists(own)) return own;
  const orgId = currentOrganizationId();
  if (orgId && (await isPlatformOrg(orgId)) && (await objectExists(LEGACY_SIGNATURE_KEY))) {
    return LEGACY_SIGNATURE_KEY;
  }
  return null;
}

export async function getSignatureBuffer(): Promise<Buffer | null> {
  const key = await resolveSignatureKey();
  return key ? getObjectBuffer(key) : null;
}

/** Every key a signature could live at for this workspace, for deletion. */
export async function signatureKeysToDelete(): Promise<string[]> {
  const keys = [signatureKey()];
  const orgId = currentOrganizationId();
  if (orgId && (await isPlatformOrg(orgId))) keys.push(LEGACY_SIGNATURE_KEY);
  return keys;
}

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
  folder: "avatars" | "documents" | "content" | "inbox" | "pages" | "tasks",
  mimeType: string
): Promise<string> {
  const ext = path.extname(originalName) || "";
  const key = namespacedKey(folder, ext);

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
  folder: "avatars" | "documents" | "inbox",
  filename: string,
  mimeType: string,
  expiresIn = 300
): Promise<{ uploadUrl: string; key: string }> {
  const ext = path.extname(filename) || "";
  const key = namespacedKey(folder, ext);

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

/** Top-level folders that hold per-workspace objects (see namespacedKey). */
const ORG_FOLDERS = ["avatars", "documents", "content", "inbox", "pages", "tasks", "branding"];

/**
 * Deletes every object a workspace owns — everything under `<folder>/<orgId>/`.
 * Returns how many were removed. Only namespaced keys are touched, so a
 * workspace's purge can never reach legacy platform files or another tenant's.
 */
export async function deleteOrgObjects(organizationId: string): Promise<number> {
  if (!/^[0-9a-f-]{36}$/i.test(organizationId)) throw new Error("deleteOrgObjects needs a workspace id");
  let deleted = 0;
  for (const folder of ORG_FOLDERS) {
    let token: string | undefined;
    do {
      const page = await s3.send(
        new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `${folder}/${organizationId}/`, ContinuationToken: token })
      );
      const keys = (page.Contents ?? []).map((o) => ({ Key: o.Key! }));
      if (keys.length) {
        await s3.send(new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: keys, Quiet: true } }));
        deleted += keys.length;
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
  }
  return deleted;
}
