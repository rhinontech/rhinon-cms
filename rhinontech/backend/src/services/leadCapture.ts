import { Lead } from "../models";

export function str(v: unknown, max = 500): string | null {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s.slice(0, max);
}

export interface LeadCaptureInput {
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  website?: string | null;
  industry?: string | null;
  source: string;
  summary?: string | null;
  raw?: Record<string, unknown> | null;
}

/**
 * Mirrors the dedupe rules in POST /public/platform-leads: `Lead.email` is unique, so a repeat
 * enquiry appends to notes and merges only the fields actually supplied, instead of failing the
 * insert or wiping earlier data.
 */
export async function findOrMergeLead(input: LeadCaptureInput): Promise<Lead> {
  const email = input.email.toLowerCase();
  const existing = await Lead.findOne({ where: { email } });

  if (existing) {
    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    const notes = [existing.notes, `[${stamp}] ${input.source} enquiry: ${input.summary || "(no details)"}`]
      .filter(Boolean)
      .join("\n");
    const rawProvided = Object.fromEntries(Object.entries(input.raw || {}).filter(([, v]) => v != null));
    await existing.update({
      notes,
      phone: existing.phone || input.phone || undefined,
      website: existing.website || input.website || undefined,
      raw: { ...(existing.raw || {}), ...rawProvided },
    });
    return existing;
  }

  return Lead.create({
    name: input.name,
    email,
    company: input.company || "Platform Lead",
    phone: input.phone,
    website: input.website,
    industry: input.industry,
    notes: input.summary || null,
    source: input.source,
    status: "New",
    raw: input.raw,
  } as any);
}
