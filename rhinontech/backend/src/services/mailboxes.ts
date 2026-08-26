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
 * Config — OUTREACH_MAILBOXES, comma-separated, each `email|Display Name|cap`
 * with the last two optional:
 *   sales@rhinon.tech|Rhinon Sales|80, hello@rhinon.tech|Rhinon|50
 *
 * Note this rotates the *From address only*. Every message still leaves through
 * the one configured transport (SES or SMTP), so each address must be verified
 * on it — this is not the same as sending from genuinely separate mailboxes,
 * and it does not multiply your provider's own sending limits.
 */
export interface Mailbox {
  email: string;
  name?: string;
  dailyCap: number;
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
      const [email, name, cap] = entry.split("|").map((part) => (part || "").trim());
      return {
        email,
        name: name || undefined,
        dailyCap: Number(cap) > 0 ? Number(cap) : DEFAULT_CAP,
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
