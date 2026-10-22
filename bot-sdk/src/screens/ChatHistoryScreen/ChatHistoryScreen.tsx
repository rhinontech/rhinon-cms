import React, { useEffect, useState } from 'react';
import './ChatHistoryScreen.scss';
import { Loader } from '@/components/common';

// New imports from restructured modules
import type { ChatbotConfig, ConversationItem, ChatHistoryScreenProps } from '@/types';
import { getConversationByUserId } from '@/services/chat';
import { resolveS3Key } from '@/utils/s3KeyResolver';
import { AVATARS } from '@/constants/urls';
import { ChevronRight, MessageCircle, Send } from 'lucide-react';

const ChatHistoryScreen: React.FC<ChatHistoryScreenProps> = ({
  isFreePlan,
  onChatSelect,
  setIsSpeakingWithRealPerson,
  userId,
  appId,
  chatbot_config,
  isAdmin,
}) => {
  const [conversationIds, setConversationIds] = useState<ConversationItem[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(true);

  const fetchConversation = async () => {
    try {
      const response = await getConversationByUserId(userId, appId);
      const sortedConversations = response.conversation.sort(
        (a: ConversationItem, b: ConversationItem) =>
          new Date(b.last_chat_time).getTime() -
          new Date(a.last_chat_time).getTime(),
      );

      if (isFreePlan || isAdmin) {
        // Admin preview: sample conversations so the layout can be judged.
        const ago = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
        setConversationIds([
          { conversation_id: "NEW_CHAT", last_chat_time: ago(0.3), title: "Pricing for an MVP", lastMessage: "A typical MVP starts at INR 4,00,000 and takes 6–8 weeks.", type: "bot" },
          { conversation_id: "NEW_CHAT", last_chat_time: ago(5), title: "Support", name: "Priya from the team", lastMessage: "I've shared the proposal on email — let me know!", type: "support", unreadCount: 1 },
          { conversation_id: "NEW_CHAT", last_chat_time: ago(50), title: "Integration question", lastMessage: "Yes, we can connect it to your existing CRM.", type: "bot" },
        ] as ConversationItem[]);
        return;
      }
      const resolvedConversations = await Promise.all(sortedConversations.map(async (chat: ConversationItem) => {
        if (chat.avatar) {
          const resolvedAvatar = await resolveS3Key(chat.avatar, null);
          return { ...chat, avatar: resolvedAvatar };
        }
        return chat;
      }));

      setConversationIds(resolvedConversations);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchConversation();
  }, [userId, appId]);

  //  Auto-start new chat if free plan
  useEffect(() => {
    if ((isFreePlan || isAdmin) && !chatbot_config?.isChatHistory) {
      setLoading(true);
      const timer = setTimeout(() => {
        onChatSelect('NEW_CHAT');
        setIsSpeakingWithRealPerson(false);
        setLoading(false);
      }, 1);
      return () => clearTimeout(timer);
    }
  }, [isFreePlan, onChatSelect, isAdmin, chatbot_config?.isChatHistory]);

  // Check if a conversation is still active (within 15 minutes)
  const findActiveConversation = () => {
    return conversationIds.find((chat) => {
      const last = new Date(chat.last_chat_time).getTime();
      return Date.now() - last <= 15 * 60 * 1000; // 15 minutes
    });
  };

  //  Handle start button click
  const handleStartConversation = () => {

    if (isFreePlan || isAdmin) {
      onChatSelect('NEW_CHAT');
      setIsSpeakingWithRealPerson(false);
      return;
    }

    const activeConvo = findActiveConversation();
    if (activeConvo) {
      onChatSelect(activeConvo.conversation_id);
    } else {
      setIsSpeakingWithRealPerson(false);
      onChatSelect('NEW_CHAT');
    }
  };

  if (loading) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Loader />
      </div>
    );
  }

  return (
    <div className='chat-list-screen rh-history' style={{ ['--primary-color' as any]: chatbot_config.primaryColor }}>
      <div className='rh-history-header'>
        <h2>Messages</h2>
        <p>Your conversations with {chatbot_config.chatbotName || 'us'}</p>
      </div>

      <div className='rh-history-list'>
        {conversationIds.length === 0 ? (
          <div className='rh-history-empty'>
            <span className='rh-history-empty-icon'><MessageCircle size={26} /></span>
            <p className='rh-empty-title'>No conversations yet</p>
            <p className='rh-empty-sub'>Ask us anything — the answer usually takes seconds.</p>
          </div>
        ) : (
          conversationIds.map((chat, i) => {
            const isSupport = chat.type === 'support' || chat.title === 'Support Chat';
            const avatar = chat.avatar || (isSupport ? AVATARS.SUPPORT : AVATARS.BOT);
            const preview =
              chat.lastMessage?.includes('<a href') || chat.lastMessage?.includes('platform-uploads')
                ? '📎 Attachment'
                : chat.lastMessage;
            return (
              <button type='button' key={`${chat.conversation_id}-${i}`} className='rh-history-row' onClick={() => onChatSelect(chat.conversation_id)}>
                <span className='rh-history-avatar'>
                  <img src={avatar} alt='' />
                  {chat.isOnline && <span className='rh-history-online' />}
                </span>
                <span className='rh-history-text'>
                  <span className='rh-history-top'>
                    <span className='rh-history-name'>{chat.name || chat.title}</span>
                    <span className='rh-history-time'>{timeAgo(chat.last_chat_time)}</span>
                  </span>
                  <span className='rh-history-bottom'>
                    <span className={`rh-history-preview ${chat.unreadCount ? 'unread' : ''}`}>
                      {preview || (isSupport ? 'Chat with the team' : 'Chat with the assistant')}
                    </span>
                    {!!chat.unreadCount && <span className='rh-history-badge'>{chat.unreadCount}</span>}
                  </span>
                </span>
                <ChevronRight size={16} className='rh-history-chevron' />
              </button>
            );
          })
        )}
      </div>

      <div className='rh-history-footer'>
        <button type='button' className='rh-history-cta' onClick={handleStartConversation}>
          <Send size={16} /> {conversationIds.length ? 'Send us a message' : 'Start a conversation'}
        </button>
      </div>
    </div>
  );
};

/** "now", "5 min", "3 h", "Mon", "12 Feb" — compact, like messaging apps. */
function timeAgo(iso: string): string {
  const then = new Date(iso);
  const diff = Date.now() - then.getTime();
  if (Number.isNaN(diff)) return '';
  const min = Math.round(diff / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  if (h < 24 * 7) return then.toLocaleDateString(undefined, { weekday: 'short' });
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default ChatHistoryScreen;
