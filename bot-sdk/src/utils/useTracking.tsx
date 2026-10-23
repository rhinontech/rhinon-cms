import { useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '@/services/api';

/**
 * Visitor presence: one socket per page load so the team sees who is on the
 * site right now and can open the chat for them (`open_chat`).
 *
 * Saleszium's version also beaconed page views, scrolls and clicks to /seo/*
 * and looked the visitor's IP up at api.ipify.org. SEO tracking is out of
 * scope here, and the server already sees the address, so both are gone.
 */

// Persistent visitor ID (stored in localStorage)
const getVisitorId = (): string => {
  let visitorId = localStorage.getItem('userId');
  if (!visitorId) {
    visitorId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('userId', visitorId);
  }
  return visitorId;
};

export const connectToSocket = (appId: string): Socket => {
  const userEmail = Cookies.get('userEmail') || null;

  const socket: Socket = io(getSocketUrl(), {
    query: {
      chatbot_id: appId,
      visitor_id: getVisitorId(),
      user_email: userEmail || 'New Customer',
      is_visitor: 'true',
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer,
    },
    transports: ['websocket'],
  });

  // Single-page sites change the URL without reloading. Checking every couple
  // of seconds catches pushState, replaceState and back/forward alike without
  // patching the site's history API.
  let lastUrl = window.location.href;
  const watch = window.setInterval(() => {
    if (window.location.href === lastUrl) return;
    lastUrl = window.location.href;
    socket.emit('visitor:page', { url: lastUrl, title: document.title });
  }, 2000);
  socket.on('disconnect', () => {
    if (!socket.active) window.clearInterval(watch);
  });

  socket.on('open_chat', ({ conversationId }) => {
    window.dispatchEvent(new CustomEvent('open_chat_from_server', { detail: { conversationId } }));
  });

  socket.on('call_request_manual', (data) => {
    window.dispatchEvent(new CustomEvent('call_request_from_server', { detail: data }));
  });

  return socket;
};

const useTracking = (appId: string, enabled: boolean) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !appId || socketRef.current) return;
    socketRef.current = connectToSocket(appId);
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [appId, enabled]);
};

export default useTracking;
