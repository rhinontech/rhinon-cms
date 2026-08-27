import { Op } from "sequelize";
import { Activity } from "../models";

/**
 * Sender rotation for sequence email.
 *
 * Deliverability degrades when one address carries all the volume, so sends are
 * spread across a pool with a per-address daily ceiling. The pool is optional:
 * with nothing configured this returns null and the caller falls back to the
 * single default sender, which is exactly today's behaviour.
 *
 * Config — OUTREACH_MAILBOXES, comma-separated. Everything after the address
 * is optional:
 *   email|Display Name|dailyCap|smtpPassword|smtpHost|smtpPort
 *
 *   sales@rhinon.tech|Rhinon Sales|80|app-password-here
 *   hello@rhinon.tech|Rhinon|50
 *
 * Supply a password and the message goes out through that mailbox's own SMTP
 * transport, which is what actually distributes sending reputation. Leave it
 * out and only the From header changes, still over the shared transport — that
 * address must then be verified on it, and provider limits stay shared.
 */
export interface Mailbox {
  email: string;
  name?: string;
  dailyCap: number;
  /** Present only when this mailbox has its own credentials. */
  smtpAuth?: { user: string; pass: string; host?: string; port?: number };
}

const DEFAULT_CAP = Number(process.env.OUTREACH_MAILBOX_DAILY_CAP || 100);

let cached: Mailbox[] | null = null;

export function getMailboxPool(): Mailbox[] {
  if (cached) return cached;

  const raw = (process.env.OUTREACH_MAILBOXES || "").trim();
  if (!raw) {
    cached = [];
    return cached;
  }

  cached = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [email, name, cap, pass, host, port] = entry.split("|").map((part) => (part || "").trim());
      return {
        email,
        name: name || undefined,
        dailyCap: Number(cap) > 0 ? Number(cap) : DEFAULT_CAP,
        smtpAuth: pass
          ? { user: email, pass, host: host || undefined, port: port ? Number(port) : undefined }
          : undefined,
      };
    })
    .filter((m) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email));

  return cached;
}

export function isRotationEnabled(): boolean {
  return getMailboxPool().length > 0;
}

/**
 * Picks the pool address furthest below its daily ceiling, so load levels out
 * instead of hammering the first entry. Returns null when the pool is empty or
 * every address is capped — the caller decides whether to defer or fall back.
 */
export async function pickMailbox(): Promise<{ mailbox: Mailbox | null; allCapped: boolean }> {
  const pool = getMailboxPool();
  if (pool.length === 0) return { mailbox: null, allCapped: false };

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Sends are already recorded on the CRM timeline; the sending address rides
  // along in metadata, so today's usage is one grouped read rather than its own
  // counter table.
  const sentToday = await Activity.findAll({
    where: {
      type: "Email",
      direction: "Outbound",
      occurredAt: { [Op.gte]: startOfDay },
      metadata: { [Op.contains]: { source: "workflow" } } as any,
    },
    attributes: ["metadata"],
    raw: true,
  });

  const used = new Map<string, number>();
  for (const row of sentToday as any[]) {
    const from = row.metadata?.from;
    if (from) used.set(from, (used.get(from) || 0) + 1);
  }

  const withHeadroom = pool
    .map((m) => ({ mailbox: m, headroom: m.dailyCap - (used.get(m.email) || 0) }))
    .filter((entry) => entry.headroom > 0)
    .sort((a, b) => b.headroom - a.headroom);

  if (withHeadroom.length === 0) return { mailbox: null, allCapped: true };
  return { mailbox: withHeadroom[0].mailbox, allCapped: false };
}
