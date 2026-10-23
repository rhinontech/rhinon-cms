import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ConnectedAccount, type AccountProvider } from "../models/ConnectedAccount";
import { apiBase } from "./analyticsSetup";
import { decryptSecret, encryptSecret } from "./totp";

/**
 * Settings → Accounts: a person connects their own Gmail or Outlook so ticket
 * replies can go out from it. Ported from Saleszium, but the whole OAuth
 * exchange happens here — Saleszium did it in the browser with the client
 * secret shipped to every visitor.
 *
 * Credentials: for now the Saleszium OAuth apps (MAIL_GOOGLE_* and
 * MICROSOFT_*). Each app must list `${apiBase()}/integrations/accounts/<provider>/callback`
 * as a redirect URI.
 */

interface ProviderConfig {
  clientId?: string;
  clientSecret?: string;
  authUrl: string;
  tokenUrl: string;
  scope: string;
  extraAuthParams: Record<string, string>;
}

const MS_TENANT = () => process.env.MICROSOFT_TENANT || "common";

function config(provider: AccountProvider): ProviderConfig {
  if (provider === "GOOGLE") {
    return {
      clientId: process.env.MAIL_GOOGLE_CLIENT_ID,
      clientSecret: process.env.MAIL_GOOGLE_CLIENT_SECRET,
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      // Send mail and manage calendar events — never read mail.
      scope: "openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.events",
      // offline + consent: the only way to be sure of a refresh token.
      extraAuthParams: { access_type: "offline", prompt: "consent", include_granted_scopes: "true" },
    };
  }
  return {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    authUrl: `https://login.microsoftonline.com/${MS_TENANT()}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${MS_TENANT()}/oauth2/v2.0/token`,
    scope: "openid email profile offline_access User.Read Mail.Send Calendars.ReadWrite",
    extraAuthParams: { prompt: "select_account" },
  };
}

export const PROVIDERS: AccountProvider[] = ["GOOGLE", "MICROSOFT"];
export const parseProvider = (v: unknown): AccountProvider | null => {
  const p = String(v ?? "").toUpperCase();
  return p === "GOOGLE" || p === "MICROSOFT" ? p : null;
};

export const isConfigured = (provider: AccountProvider) => {
  const c = config(provider);
  return !!(c.clientId && c.clientSecret);
};

export const callbackUrl = (provider: AccountProvider) => `${apiBase()}/integrations/accounts/${provider.toLowerCase()}/callback`;

interface OAuthState {
  userId: string;
  organizationId: string;
  provider: AccountProvider;
  returnTo: string;
}

/** Signed and short-lived, so a callback can't be replayed or pointed at someone else. */
export function consentUrl(state: OAuthState): string {
  const c = config(state.provider);
  const signed = jwt.sign({ ...state, purpose: "connect-account" }, env.jwtSecret, { expiresIn: "10m" });
  const params = new URLSearchParams({
    client_id: c.clientId!,
    response_type: "code",
    redirect_uri: callbackUrl(state.provider),
    scope: c.scope,
    state: signed,
    ...c.extraAuthParams,
  });
  return `${c.authUrl}?${params}`;
}

export function readState(token: string): OAuthState | null {
  try {
    const s = jwt.verify(token, env.jwtSecret) as OAuthState & { purpose?: string };
    return s.purpose === "connect-account" && parseProvider(s.provider) ? s : null;
  } catch {
    return null;
  }
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

async function tokenRequest(provider: AccountProvider, body: Record<string, string>): Promise<TokenResponse> {
  const c = config(provider);
  const res = await fetch(c.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: c.clientId!, client_secret: c.clientSecret!, ...body }),
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || !data.access_token) throw new Error(data.error_description || data.error || `Token request failed (${res.status})`);
  return data;
}

async function profile(provider: AccountProvider, accessToken: string): Promise<{ email: string; name: string | null }> {
  const url = provider === "GOOGLE" ? "https://openidconnect.googleapis.com/v1/userinfo" : "https://graph.microsoft.com/v1.0/me";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = (await res.json().catch(() => ({}))) as any;
  const email = provider === "GOOGLE" ? data.email : data.mail || data.userPrincipalName;
  if (!res.ok || !email) throw new Error("Could not read the account's email address");
  return { email: String(email).toLowerCase(), name: (provider === "GOOGLE" ? data.name : data.displayName) || null };
}

/** The OAuth callback: swap the code for tokens and save (or replace) the account. */
export async function connectAccount(provider: AccountProvider, userId: string, code: string) {
  const tokens = await tokenRequest(provider, { grant_type: "authorization_code", code, redirect_uri: callbackUrl(provider) });
  const who = await profile(provider, tokens.access_token);
  const existing = await ConnectedAccount.findOne({ where: { userId, provider } });
  const refresh = tokens.refresh_token ? encryptSecret(tokens.refresh_token) : existing?.refreshToken;
  if (!refresh) throw new Error("The provider didn't return a refresh token");
  const fields = {
    email: who.email,
    name: who.name,
    accessToken: encryptSecret(tokens.access_token),
    refreshToken: refresh,
    expiresAt: new Date(Date.now() + (tokens.expires_in - 60) * 1000),
    scope: tokens.scope ?? null,
  };
  if (existing) await existing.update(fields);
  else await ConnectedAccount.create({ userId, provider, ...fields });
  return who;
}

/** True when the account was connected with calendar access (older connections weren't). */
export function hasCalendarAccess(account: ConnectedAccount): boolean {
  const scope = (account.scope ?? "").toLowerCase();
  return account.provider === "GOOGLE" ? scope.includes("calendar.events") : scope.includes("calendars.readwrite");
}

/**
 * Roughly how many recipients a day the provider lets this mailbox send to.
 * Consumer accounts get far less than Workspace / Microsoft 365 ones.
 */
export function dailySendLimit(account: ConnectedAccount): number {
  const domain = account.email.split("@")[1] ?? "";
  if (account.provider === "GOOGLE") return /^(gmail|googlemail)\.com$/.test(domain) ? 500 : 2000;
  return /^(outlook|hotmail|live|msn)\.[a-z.]+$/.test(domain) ? 300 : 10000;
}

const today = () => new Date().toISOString().slice(0, 10);

/** Sends counted today (the counter resets on the first send of a new UTC day). */
export const sentToday = (account: ConnectedAccount) => (account.sentOn === today() ? account.sentCount : 0);

async function countSend(account: ConnectedAccount, recipients: number) {
  const day = today();
  await account.update({ sentOn: day, sentCount: (account.sentOn === day ? account.sentCount : 0) + recipients });
}

/** A valid access token, refreshed when it's about to expire. */
export async function accessToken(account: ConnectedAccount): Promise<string> {
  if (account.expiresAt.getTime() > Date.now()) return decryptSecret(account.accessToken);
  const tokens = await tokenRequest(account.provider, { grant_type: "refresh_token", refresh_token: decryptSecret(account.refreshToken) });
  await account.update({
    accessToken: encryptSecret(tokens.access_token),
    // Microsoft rotates refresh tokens; Google keeps the old one.
    ...(tokens.refresh_token ? { refreshToken: encryptSecret(tokens.refresh_token) } : {}),
    expiresAt: new Date(Date.now() + (tokens.expires_in - 60) * 1000),
  });
  return tokens.access_token;
}

const headerSafe = (s: string) => s.replace(/[\r\n]+/g, " ");
const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const encodeWord = (s: string) => `=?UTF-8?B?${Buffer.from(headerSafe(s)).toString("base64")}?=`;
const wrap76 = (b64: string) => b64.replace(/.{1,76}/g, "$&\r\n").trimEnd();
const asList = (v?: string | string[]) => (Array.isArray(v) ? v : v ? [v] : []).map(headerSafe).filter(Boolean);

export interface AccountMail {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  /** Where replies go — the user's platform address, so they land in the platform inbox. */
  replyTo?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
  /** Extra headers (Gmail only; Microsoft Graph accepts just X- headers). */
  headers?: Record<string, string>;
}

/** Sends one email from the person's own mailbox and counts it. Throws when it doesn't go out. */
export async function sendFromAccount(account: ConnectedAccount, mail: AccountMail) {
  const token = await accessToken(account);
  const to = asList(mail.to);
  const cc = asList(mail.cc);
  if (!to.length) throw new Error("No recipient");

  if (account.provider === "GOOGLE") {
    const from = mail.fromName ? `${encodeWord(mail.fromName)} <${account.email}>` : account.email;
    const head = [
      `From: ${from}`,
      `To: ${to.join(", ")}`,
      ...(cc.length ? [`Cc: ${cc.join(", ")}`] : []),
      ...(mail.replyTo ? [`Reply-To: ${headerSafe(mail.replyTo)}`] : []),
      `Subject: ${encodeWord(mail.subject)}`,
      ...Object.entries(mail.headers ?? {}).map(([k, v]) => `${headerSafe(k)}: ${headerSafe(v)}`),
      "MIME-Version: 1.0",
    ];
    const alt = `alt_${crypto.randomUUID()}`;
    const altPart = [
      `Content-Type: multipart/alternative; boundary="${alt}"`,
      "",
      `--${alt}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      wrap76(Buffer.from(mail.text ?? mail.html.replace(/<[^>]+>/g, "")).toString("base64")),
      `--${alt}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      wrap76(Buffer.from(mail.html).toString("base64")),
      `--${alt}--`,
    ];
    let body: string[];
    if (mail.attachments?.length) {
      const mixed = `mix_${crypto.randomUUID()}`;
      body = [`Content-Type: multipart/mixed; boundary="${mixed}"`, "", `--${mixed}`, ...altPart];
      for (const a of mail.attachments) {
        const name = headerSafe(a.filename).replace(/"/g, "");
        body.push(
          `--${mixed}`,
          `Content-Type: ${a.contentType || "application/octet-stream"}; name="${name}"`,
          `Content-Disposition: attachment; filename="${name}"`,
          "Content-Transfer-Encoding: base64",
          "",
          wrap76(a.content.toString("base64"))
        );
      }
      body.push(`--${mixed}--`);
    } else {
      body = altPart;
    }
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: b64url([...head, ...body].join("\r\n")) }),
    });
    if (!res.ok) throw new Error(`Gmail refused the message (${res.status})`);
  } else {
    const xHeaders = Object.entries(mail.headers ?? {})
      .filter(([k]) => /^x-/i.test(k))
      .map(([name, value]) => ({ name, value: headerSafe(value) }));
    const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          subject: mail.subject,
          body: { contentType: "HTML", content: mail.html },
          toRecipients: to.map((address) => ({ emailAddress: { address } })),
          ccRecipients: cc.map((address) => ({ emailAddress: { address } })),
          ...(mail.replyTo ? { replyTo: [{ emailAddress: { address: mail.replyTo } }] } : {}),
          ...(xHeaders.length ? { internetMessageHeaders: xHeaders } : {}),
          ...(mail.attachments?.length
            ? {
                attachments: mail.attachments.map((a) => ({
                  "@odata.type": "#microsoft.graph.fileAttachment",
                  name: a.filename,
                  contentType: a.contentType || "application/octet-stream",
                  contentBytes: a.content.toString("base64"),
                })),
              }
            : {}),
        },
        saveToSentItems: true,
      }),
    });
    if (!res.ok) throw new Error(`Outlook refused the message (${res.status})`);
  }
  await countSend(account, to.length + cc.length);
}

/** Safe to send to the browser: no tokens. */
export const publicAccount = (a: ConnectedAccount) => ({
  provider: a.provider,
  email: a.email,
  name: a.name,
  connectedAt: a.createdAt,
  calendarAccess: hasCalendarAccess(a),
  sentToday: sentToday(a),
  dailyLimit: dailySendLimit(a),
});
