import { MailboxAddress, User } from "../models";
import { mailboxVariants } from "./siteSender";

/** Letters, digits, dots, hyphens, underscores — the same rule as employee prefixes. */
export const LOCAL_PART_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;

export interface UserMailbox {
  /** On the workspace's own domain; brandSender() moves it per brand. */
  address: string;
  /** Sender name for mail sent from this address. */
  name: string;
  /** false for the person's own company address. */
  shared: boolean;
  id?: string;
}

/**
 * Every address a person sends and receives as: their own company address
 * first, then each extra address the superadmin assigned them.
 */
export async function mailboxesFor(user: {
  id: string;
  companyEmail?: string | null;
  fullName?: string | null;
  emailDomain: string;
}): Promise<UserMailbox[]> {
  const out: UserMailbox[] = [];
  const fullName = user.fullName || "";
  if (user.companyEmail) out.push({ address: user.companyEmail.toLowerCase(), name: fullName, shared: false });

  const assigned = await MailboxAddress.findAll({ where: { assignedUserId: user.id }, order: [["localPart", "ASC"]] });
  for (const row of assigned) {
    out.push({
      id: row.id,
      address: `${row.localPart}@${user.emailDomain}`.toLowerCase(),
      name: row.displayName || fullName,
      shared: true,
    });
  }
  return out;
}

/**
 * Which of the person's mailboxes `address` is, matching any brand's variant —
 * hello@uppercurve.in is the same mailbox as hello@rhinontech.in.
 */
export function findMailbox(mailboxes: UserMailbox[], address: unknown): UserMailbox | null {
  if (typeof address !== "string" || !address.includes("@")) return null;
  const wanted = address.trim().toLowerCase();
  return mailboxes.find((m) => mailboxVariants(m.address).includes(wanted)) ?? null;
}

/** Every stored ownerEmail value that belongs to these mailboxes, across brands. */
export function ownerVariants(mailboxes: UserMailbox[]): string[] {
  return [...new Set(mailboxes.flatMap((m) => mailboxVariants(m.address)))];
}

/**
 * Whether `localPart` is free on this workspace's domain — neither an extra
 * address nor anyone's own company address. Tenant-scoped by the model hooks.
 */
export async function addressTaken(localPart: string, emailDomain: string, exceptId?: string): Promise<string | null> {
  const address = `${localPart}@${emailDomain}`;
  const user = await User.findOne({ where: { companyEmail: address }, attributes: ["fullName"] });
  if (user) return `${address} is ${user.fullName}'s own address.`;
  const existing = await MailboxAddress.findOne({ where: { localPart } });
  if (existing && existing.id !== exceptId) return `${address} already exists.`;
  return null;
}
