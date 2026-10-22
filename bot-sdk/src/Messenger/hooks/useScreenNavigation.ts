// useScreenNavigation - Screen navigation and event handlers
import { useEffect, useCallback } from 'react';
import type { UseMessengerStateReturn } from './useMessengerState';

interface UseScreenNavigationProps {
  state: Pick<
    UseMessengerStateReturn,
    | 'setIsOpen'
    | 'setActiveScreen'
    | 'setSelectedChatId'
    | 'setIsSpeakingWithRealPerson'
  > & {
    setIsExternalTrigger?: React.Dispatch<React.SetStateAction<boolean>>;
    isChatHistory: boolean;
  };
}

export function useScreenNavigation({ state }: UseScreenNavigationProps) {
  const { setIsOpen, setActiveScreen, setSelectedChatId, setIsSpeakingWithRealPerson, setIsExternalTrigger, isChatHistory } = state;

  // Toggle chat open/closed
  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, [setIsOpen]);

  // Navigate to a screen
  const handleNavigate = useCallback(
    (screen: string) => {
      setActiveScreen(screen);   
      // if (screen === 'chats') {
      //   setSelectedChatId(null);
      // }
    },
    [setActiveScreen, setSelectedChatId]
  );

  // Select a specific chat
  const handleChatSelect = useCallback(
    (chatId: string) => {
      setSelectedChatId(chatId);
    },
    [setSelectedChatId]
  );

  // Go back to chat list
  const handleBackToChats = useCallback(() => {
    if (isChatHistory) {
      setSelectedChatId(null);
      // setIsSpeakingWithRealPerson(false);
      setActiveScreen('chats');
    } else {
      setActiveScreen('home')
    }
  }, [setActiveScreen, setSelectedChatId, setIsSpeakingWithRealPerson, isChatHistory]);

  // Navigate to raise ticket screen
  const raiseTicket = useCallback(() => {
    setActiveScreen('raiseTicket');
  }, [setActiveScreen]);

  // Handle closing the chat
  const handleClose = useCallback(() => {
    setIsOpen(false);
    const closeChatEvent = new CustomEvent('close_chat_from_server');
    window.dispatchEvent(closeChatEvent);
  }, [setIsOpen]);

  // Handle chat open event from server
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent<{ conversationId?: string }>) => {
      const conversationId = event.detail?.conversationId;
      if (!conversationId) return;

      // Always ensure chat UI is open
      setIsOpen(true);

      // Close or reset the existing conversation if any
      setSelectedChatId(null);

      // Open new conversation
      setTimeout(() => {
        setSelectedChatId(conversationId);
      }, 0);

      // Set UI state
      setActiveScreen('chats');
      setIsSpeakingWithRealPerson(true);
    };

    window.addEventListener('open_chat_from_server', handleOpenChat as EventListener);
    return () => {
      window.removeEventListener('open_chat_from_server', handleOpenChat as EventListener);
    };
  }, [setIsOpen, setActiveScreen, setSelectedChatId, setIsSpeakingWithRealPerson]);

  return {
    toggleChat,
    handleNavigate,
    handleChatSelect,
    handleBackToChats,
    raiseTicket,
    handleClose,
  };
}
