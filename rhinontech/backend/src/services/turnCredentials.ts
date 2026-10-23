import crypto from "node:crypto";

/**
 * Short-lived TURN credentials (the "TURN REST API" scheme coturn implements
 * with `use-auth-secret`). The secret is shared only between this server and
 * coturn; clients get a username that carries its own expiry plus an HMAC of
 * it, so nothing reusable ever ships in the widget or the admin bundle.
 *
 *   username   = "<unix expiry>:<label>"
 *   credential = base64(HMAC-SHA1(TURN_SECRET, username))
 *
 * Env: TURN_SECRET (same value as coturn's static-auth-secret), TURN_HOST
 * (default turn.rhinontech.in).
 */

/** Long enough for a call, short enough that a copied credential soon dies. */
const TTL_SECONDS = 4 * 60 * 60;

export const turnConfigured = () => Boolean(process.env.TURN_SECRET);

export function iceServersFor(label: string): RTCIceServerLike[] {
  const host = process.env.TURN_HOST || "turn.rhinontech.in";
  const servers: RTCIceServerLike[] = [{ urls: ["stun:stun.l.google.com:19302", `stun:${host}:3478`] }];
  const secret = process.env.TURN_SECRET;
  if (!secret) return servers; // STUN only: calls on the same network still connect.
  const expiry = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const username = `${expiry}:${label.replace(/[^\w.-]/g, "").slice(0, 40) || "user"}`;
  const credential = crypto.createHmac("sha1", secret).update(username).digest("base64");
  servers.push({ urls: [`turn:${host}:3478?transport=udp`, `turn:${host}:3478?transport=tcp`], username, credential });
  return servers;
}

export interface RTCIceServerLike {
  urls: string[];
  username?: string;
  credential?: string;
}
