// Chat timeout hook - handles conversation inactivity timeout
import { useRef, useCallback } from 'react';
import { DEFAULT_TIMEOUT_DURATION } from '@/constants/timing';

interface UseChatTimeoutProps {
  timeoutDuration?: number;
  onTimeout: () => void;
  isActive: boolean;
}

interface UseChatTimeoutReturn {
  resetTimeout: () => void;
  checkActivity: () => boolean;
  hasTimedOut: boolean;
  lastMessageTime: Date;
}

export const useChatTimeout = ({
  timeoutDuration = DEFAULT_TIMEOUT_DURATION,
  onTimeout,
  isActive,
}: UseChatTimeoutProps): UseChatTimeoutReturn => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const hasTimedOutRef = useRef<boolean>(false);
  const lastMessageTimeRef = useRef<Date>(new Date());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const handleTimeout = useCallback(() => {
    if (hasTimedOutRef.current) return;
    hasTimedOutRef.current = true;
    clearTimers();
    onTimeout();
  }, [onTimeout, clearTimers]);

  const resetTimeout = useCallback(() => {
    if (hasTimedOutRef.current || !isActive) return;

    lastMessageTimeRef.current = new Date();
    clearTimers();

    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, timeoutDuration);

    countdownRef.current = setInterval(() => {
      if (hasTimedOutRef.current) {
        clearInterval(countdownRef.current!);
        return;
      }

      const now = new Date();
      const elapsed = now.getTime() - lastMessageTimeRef.current.getTime();
      const remaining = Math.max(0, timeoutDuration - elapsed);

      if (remaining === 0) {
        clearInterval(countdownRef.current!);
        handleTimeout();
      }
    }, 1000);
  }, [isActive, timeoutDuration, handleTimeout, clearTimers]);

  const checkActivity = useCallback((): boolean => {
    const now = Date.now();
    const lastMessageTime = lastMessageTimeRef.current.getTime();
    const timeSinceLastMessage = now - lastMessageTime;

    if (timeSinceLastMessage > timeoutDuration) {
      handleTimeout();
      return false;
    }
    return true;
  }, [timeoutDuration, handleTimeout]);

  return {
    resetTimeout,
    checkActivity,
    hasTimedOut: hasTimedOutRef.current,
    lastMessageTime: lastMessageTimeRef.current,
  };
};

export default useChatTimeout;
