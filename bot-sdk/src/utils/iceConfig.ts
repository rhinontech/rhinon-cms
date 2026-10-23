/**
 * ICE (STUN/TURN) servers for voice calls.
 *
 * TURN credentials are never built into the widget: the backend mints
 * short-lived ones (services/turnCredentials.ts) and only for a visitor who
 * has a call ringing or live. If that request fails, the call still tries with
 * public STUN, which works whenever the two sides can reach each other directly.
 */
import { serverApi } from '@/services/api';

const STUN_ONLY: RTCIceServer[] = [{ urls: ['stun:stun.l.google.com:19302'] }];

export async function fetchIceServers(visitorId: string): Promise<RTCIceServer[]> {
  try {
    const res = await serverApi.get('/call/ice-servers', { params: { visitor_id: visitorId } });
    const servers = res.data?.iceServers;
    return Array.isArray(servers) && servers.length ? servers : STUN_ONLY;
  } catch {
    return STUN_ONLY;
  }
}
