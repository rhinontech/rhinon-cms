import React, { useEffect, useState } from 'react';
import './ChatHistoryScreen.scss';
import { Loader } from '@/components/common';

// New imports from restructured modules
import type { ChatbotConfig, ConversationItem, ChatHistoryScreenProps } from '@/types';
import { getConversationByUserId } from '@/services/chat';
import { resolveS3Key } from '@/utils/s3KeyResolver';
import { AVATARS } from '@/constants/urls';

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
        setConversationIds([
          { conversation_id: "NEW_CHAT", last_chat_time: "2026-02-12T02:17:10.083127+00:00", title: "Informal Greeting" },
          { conversation_id: "NEW_CHAT", last_chat_time: "2026-02-08T02:17:10.083127+00:00", title: "Ticket Search" },
          { conversation_id: "NEW_CHAT", last_chat_time: "2026-02-10T02:17:10.083127+00:00", title: "Product Inquiry" }
        ]);
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
    <div className='chat-list-screen'>
      {/* Header */}
      <div className='chat-list-header'>
        <div className='header-title'>
          <h2>Chat history</h2>
        </div>

        {/* Search Bar (optional) */}
        {/* <div className='search-container'>
          <Search size={16} className='search-icon' />
          <input
            type='text'
            placeholder='Search conversations'
            className='search-input'
          />
        </div> */}
      </div>

      {/* Chat List */}
      <div className='chat-list'>
        {conversationIds.length === 0 ? (
          <div className='no-chats'>
            <div></div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '30px' }}>
                  “Looking empty”
                </p>
                <p style={{ margin: 0, fontSize: '15px' }}>
                  Tap into the start conversation
                </p>
              </div>
              <button
                className='start-conversation-btn'
                style={{
                  ['--primary-color' as any]: `${chatbot_config.primaryColor}`,
                }}
                onClick={handleStartConversation}
              >
                Start Conversation
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'end',
                justifyContent: 'end',
                margin: 15,
              }}
            >
              {/* <div className='hover-card'>Connect with agent</div>
              <div className='hover-card'>Raise a ticket</div> */}
            </div>
          </div>
        ) : (
          <div className='content-chat-section'>
            <h3 style={{ margin: '20px', marginBottom: '10px' }}>
              History/Ticket Searches
            </h3>
            {conversationIds.map((chat) => (
              <div
                key={chat.conversation_id}
                style={{
                  marginBottom: 20,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  className='chat-card'
                  onClick={() => onChatSelect(chat.conversation_id)}
                >
                  <div className='chat-avatar'>
                    {chat.avatar ? (
                      <img
                        src={chat.avatar}
                        alt='agent profile'
                        style={{ borderRadius: '8px', objectFit: 'cover' }}
                      />
                    ) : chat.title === 'Support Chat' || chat.type === 'support' ? (
                      <img
                        src={AVATARS.SUPPORT}
                        alt='support profile'
                      />
                    ) : (
                      <img
                        src={AVATARS.BOT}
                        alt="bot"
                      />
                    )}
                    {chat.isOnline && <div className='online-indicator'></div>}
                  </div>

                  <div className='chat-info'>
                    <div className='chat-header-info'>
                      <div className='chat-name'>{chat.name || chat.title}</div>
                      <div className='chat-time'>
                        {/* {new Date(chat.last_chat_time).toLocaleString()} */}
                        {new Date(chat.last_chat_time).toLocaleString()}
                      </div>
                    </div>
                    {chat.lastMessage && (
                      <div className='chat-preview'>
                        <div className='last-message'>
                          {chat.lastMessage?.includes('<a href') || chat.lastMessage?.includes('platform-uploads')
                            ? '📷 Photo'
                            : chat.lastMessage}
                        </div>
                        {chat.unreadCount && (
                          <div className='unread-badge'>{chat.unreadCount}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {conversationIds.length !== 0 && (
        <div className='start-conversation-btn-hover'>
          <button
            className='start-conversation-btn'
            onClick={handleStartConversation}
            style={{
              ['--primary-color' as any]: `${chatbot_config.primaryColor}`,
              marginTop: '10px',
            }}
          >
            Start New Conversation
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatHistoryScreen;
