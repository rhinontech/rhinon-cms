import { ConnectedAccount } from "../models/ConnectedAccount";
import { User, type EmailIdentityChoice, type EmailModule, type EmailPreferences } from "../models/User";
import { sendEmail } from "./mailer";
import { sendFromAccount, type AccountMail } from "./connectedAccounts";
import { oneClickUnsubscribeUrl } from "./unsubscribeToken";

/**
 * Which address a person's mail goes out from, per module (Settings → Accounts):
 *
 *   platform  — their workspace address (you@rhinontech.in, you@acme.rhinontech.in),
 *               sent through SES. Always available; the default everywhere.
 *   GOOGLE /  — their connected Gmail or Outlook mailbox. Replies are pointed back at
 *   MICROSOFT   the platform address (Reply-To) so threads still land in the Inbox.
 *
 * Every module sends through `sendAs`, so this is the one place that decision lives.
 */

export const EMAIL_MODULES: EmailModule[] = ["inbox", "campaigns", "tickets", "meetings"];
const CHOICES: EmailIdentityChoice[] = ["platform", "GOOGLE", "MICROSOFT"];

export function cleanPreferences(raw: unknown): EmailPreferences {
  const out: EmailPreferences = {};
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  for (const m of EMAIL_MODULES) {
    const v = r[m];
    if (typeof v === "string" && (CHOICES as string[]).includes(v)) out[m] = v as EmailIdentityChoice;
  }
  return out;
}

/**
 * The connected mailbox a user picked for this module, or null for their platform
 * address. A choice whose account has since been disconnected falls back to the
 * platform address rather than failing the send.
 */
export async function accountFor(userId: string | null | undefined, module: EmailModule): Promise<ConnectedAccount | null> {
  if (!userId) return null;
  const user = await User.findByPk(userId, { attributes: ["id", "emailPreferences"] });
  const choice = user?.emailPreferences?.[module] ?? "platform";
  if (choice === "platform") return null;
  return ConnectedAccount.findOne({ where: { userId, provider: choice } });
}

export interface SendAsInput extends Omit<AccountMail, "replyTo"> {
  /** The user's platform address: the From for SES, the Reply-To for a connected mailbox. */
  platformFrom: string;
  /** SES only: one-click unsubscribe headers for bulk mail (campaigns). */
  unsubscribeFor?: string;
}

/** Sends as the identity the user chose for this module. Returns the address it went out from. */
export async function sendAs(
  userId: string | null | undefined,
  module: EmailModule,
  mail: SendAsInput,
  /** Overrides the saved preference (e.g. a one-off "Send from" pick). */
  account?: ConnectedAccount | null
): Promise<{ from: string; via: EmailIdentityChoice }> {
  const chosen = account !== undefined ? account : await accountFor(userId, module);
  if (chosen) {
    const headers = { ...(mail.headers ?? {}) };
    if (mail.unsubscribeFor) Object.assign(headers, unsubscribeHeadersFor(mail.unsubscribeFor));
    await sendFromAccount(chosen, { ...mail, headers, replyTo: mail.platformFrom });
    return { from: chosen.email, via: chosen.provider };
  }
  await sendEmail({
    to: mail.to,
    cc: mail.cc ? ([] as string[]).concat(mail.cc) : undefined,
    from: mail.platformFrom,
    fromName: mail.fromName,
    via: "ses",
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    attachments: mail.attachments,
    unsubscribeFor: mail.unsubscribeFor,
  });
  return { from: mail.platformFrom, via: "platform" };
}

/** RFC 8058 one-click unsubscribe, the same headers the SES path adds. */
function unsubscribeHeadersFor(email: string): Record<string, string> {
  return { "List-Unsubscribe": `<${oneClickUnsubscribeUrl(email)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" };
}
