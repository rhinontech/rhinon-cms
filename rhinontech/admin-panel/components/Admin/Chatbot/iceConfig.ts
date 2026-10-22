/**
 * ICE (STUN/TURN) configuration for WebRTC voice calls in Admin Panel.
 */

const FALLBACK_STUN = "stun:stun.l.google.com:19302";

const splitUrls = (value?: string): string[] =>
  (value ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

const STUN_URLS = splitUrls(process.env.NEXT_PUBLIC_STUN_URLS);
const TURN_URLS = splitUrls(process.env.NEXT_PUBLIC_TURN_URLS);
const TURN_USERNAME = process.env.NEXT_PUBLIC_TURN_USERNAME;
const TURN_CREDENTIAL = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

export const hasTurnConfigured = Boolean(
  TURN_URLS.length && TURN_USERNAME && TURN_CREDENTIAL
);

const DEFAULT_TURN_URLS = [
  "turn:35.154.151.48:3478?transport=udp",
  "turn:35.154.151.48:3478?transport=tcp",
];
const DEFAULT_TURN_USERNAME = "rhinon";
const DEFAULT_TURN_CREDENTIAL = "rhinonCall@2026";

export function getIceServers(): RTCIceServer[] {
  const stunUrls = STUN_URLS.length ? STUN_URLS : [FALLBACK_STUN, "stun:35.154.151.48:3478"];
  const servers: RTCIceServer[] = [{ urls: stunUrls }];

  if (hasTurnConfigured) {
    servers.push({
      urls: TURN_URLS,
      username: TURN_USERNAME,
      credential: TURN_CREDENTIAL,
    });
  } else {
    servers.push({
      urls: DEFAULT_TURN_URLS,
      username: DEFAULT_TURN_USERNAME,
      credential: DEFAULT_TURN_CREDENTIAL,
    });
  }

  return servers;
}
