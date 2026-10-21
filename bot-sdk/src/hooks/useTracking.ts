// Tracking hook - handles analytics and visitor tracking
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { getSocketUrl, getServerApiUrl } from '@/services/api';
import { STORAGE_KEYS, COOKIE_KEYS } from '@/constants/storage';
import { TIME_ON_PAGE_TRACK_INTERVAL } from '@/constants/timing';
import { IP_API_URL } from '@/constants/urls';

// Generate or retrieve session ID (per tab)
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  }
  return sessionId;
};

// Generate or retrieve user ID (persistent across tabs)
const getUserId = (): string => {
  let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (!userId) {
    userId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  }
  return userId;
};

// Capture UTM query parameters
const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_term: params.get('utm_term'),
    utm_content: params.get('utm_content'),
  };
};

// Fetch Public IP
const getPublicIp = async (): Promise<string> => {
  try {
    const res = await fetch(IP_API_URL);
    const data = await res.json();
    return data.ip;
  } catch (err) {
    console.warn('Failed to fetch IP address:', err);
    return 'unknown';
  }
};

// Send event to backend
const sendToTrackingServer = (endpoint: string, payload: Record<string, any>) => {
  const serverUrl = getServerApiUrl();

  payload.sessionId = getSessionId();
  payload.userId = getUserId();
  payload.screenSize = `${window.innerWidth}x${window.innerHeight}`;
  payload.language = navigator.language;

  const url = `${serverUrl}${endpoint}`;
  const blob = new Blob([JSON.stringify(payload)], {
    type: 'application/json',
  });

  if (!navigator.sendBeacon(url, blob)) {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.warn(`Tracking error for ${endpoint}:`, err);
    });
  }
};

const trackPageView = (appId: string) => {
  const referrer = sessionStorage.getItem(STORAGE_KEYS.PREV_URL) || document.referrer || 'direct';
  const url = window.location.href;
  sessionStorage.setItem(STORAGE_KEYS.PREV_URL, url);

  sendToTrackingServer('/seo/pageview', {
    chatbot_id: appId,
    url,
    referrer,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
    ...getUTMParams(),
  });
};

const trackBaseUrl = (appId: string) => {
  const baseUrl = window.location.origin;
  sendToTrackingServer('/seo/complaint-url', {
    chatbot_id: appId,
    baseUrl,
    timestamp: Date.now(),
  });
};

export const connectToSocket = async (appId: string): Promise<Socket> => {
  const visitorId = getUserId();
  const userEmail = Cookies.get(COOKIE_KEYS.USER_EMAIL) || null;
  const ipAddress = await getPublicIp();

  const socket: Socket = io(getSocketUrl(), {
    query: {
      chatbot_id: appId,
      visitor_id: visitorId,
      ip_address: ipAddress,
      user_email: !userEmail ? 'New Customer' : userEmail,
      is_visitor: 'true',
    },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log(`[Socket] Connected as visitor → ${visitorId}`);
  });

  socket.on('open_chat', ({ conversationId }) => {
    console.log('[Socket] Received open_chat event with ID:', conversationId);

    const openChatEvent = new CustomEvent('open_chat_from_server', {
      detail: { conversationId },
    });

    window.dispatchEvent(openChatEvent);
  });

  // Listen for incoming messages from support
  socket.on('message', (message) => {
    console.log('[Socket] Received message:', message);
    // Only dispatch event for support messages, not customer's own messages
    if (message.role === 'support') {
      console.log('[Socket] Support message - dispatching event');
      const messageEvent = new CustomEvent('support_message_received', {
        detail: { message },
      });
      window.dispatchEvent(messageEvent);
    }
  });

  // Listen for conversation closed events
  socket.on('conversation:closed', (data) => {
    console.log('[Socket] Conversation closed:', data);
    const closedEvent = new CustomEvent('conversation_closed_from_server', {
      detail: data,
    });
    window.dispatchEvent(closedEvent);
  });

  return socket;
};

export const useTracking = (appId: string | undefined, enabled: boolean = true) => {
  const hasTrackedRef = useRef(false);
  const pathname = window.location.pathname;

  useEffect(() => {
    if (!enabled || !appId) return;

    let hasScrolled = false;
    let interactedWithChatbot = false;
    let interval: NodeJS.Timeout | null = null;
    let startTime = Date.now();

    const startTimer = () => {
      startTime = Date.now();
      interval = setInterval(() => {
        const timeSpent = Date.now() - startTime;
        sendToTrackingServer('/seo/timeOnPage', {
          chatbot_id: appId,
          url: window.location.href,
          timeSpent,
        });
        startTime = Date.now();
      }, TIME_ON_PAGE_TRACK_INTERVAL);
    };

    const stopTimer = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const trackBounce = () => {
      const timeOnPage = Date.now() - startTime;
      sendToTrackingServer('/seo/bounce', {
        chatbot_id: appId,
        timeOnPage,
        interactedWithChatbot,
        url: window.location.href,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopTimer();
        trackBounce();
      } else if (document.visibilityState === 'visible') {
        startTimer();
      }
    };

    const onBeforeUnload = () => {
      stopTimer();
      trackBounce();
    };

    const onScroll = () => {
      if (!hasScrolled && window.scrollY > 0) {
        hasScrolled = true;
        sendToTrackingServer('/seo/scroll', {
          chatbot_id: appId,
          scrollY: window.scrollY,
          timestamp: Date.now(),
        });
      }
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.saleszium-chatbot-wrapper')) {
        interactedWithChatbot = true;
        sendToTrackingServer('/seo/click', {
          chatbot_id: appId,
          timestamp: Date.now(),
        });
      }
    };

    if (!hasTrackedRef.current) {
      trackPageView(appId);
      connectToSocket(appId);
      trackBaseUrl(appId);
      hasTrackedRef.current = true;
    }

    if (document.visibilityState === 'visible') {
      startTimer();
    }

    window.addEventListener('scroll', onScroll);
    document.addEventListener('click', onClick);
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopTimer();
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onClick);
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname, appId, enabled]);
};

export default useTracking;
