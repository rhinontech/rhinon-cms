/**
 * ICE (STUN/TURN) configuration for voice calls.
 *
 * These values are read from env rather than hardcoded because this widget and
 * the sz-app dashboard must present the SAME credentials to the SAME TURN
 * server. When they were hardcoded per-app the usernames drifted apart
 * ("saleszium" here vs "rhinon" in the dashboard), so at most one side could
 * ever authenticate and get relay candidates.
 *
 * Injected at build time by webpack DefinePlugin (see tools/webpack/*):
 *   REACT_APP_STUN_URLS       comma-separated, e.g. "stun:turn.example.com:3478"
 *   REACT_APP_TURN_URLS       comma-separated, e.g. "turn:turn.example.com:3478?transport=udp,turn:turn.example.com:3478?transport=tcp"
 *   REACT_APP_TURN_USERNAME
 *   REACT_APP_TURN_CREDENTIAL
 */

const FALLBACK_STUN = 'stun:stun.l.google.com:19302';

const splitUrls = (value?: string): string[] =>
  (value ?? '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

const STUN_URLS = splitUrls(process.env.REACT_APP_STUN_URLS);
const TURN_URLS = splitUrls(process.env.REACT_APP_TURN_URLS);
const TURN_USERNAME = process.env.REACT_APP_TURN_USERNAME;
const TURN_CREDENTIAL = process.env.REACT_APP_TURN_CREDENTIAL;

export const hasTurnConfigured = Boolean(
  TURN_URLS.length && TURN_USERNAME && TURN_CREDENTIAL,
);

export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: STUN_URLS.length ? STUN_URLS : [FALLBACK_STUN] },
  ];

  if (hasTurnConfigured) {
    servers.push({
      urls: TURN_URLS,
      username: TURN_USERNAME,
      credential: TURN_CREDENTIAL,
    });
  } else {
    console.warn(
      '[call] No TURN server configured. Calls will connect over STUN only and ' +
        'will have no audio whenever a peer sits behind a symmetric NAT. Set ' +
        'REACT_APP_TURN_URLS / REACT_APP_TURN_USERNAME / REACT_APP_TURN_CREDENTIAL.',
    );
  }

  return servers;
}
