// Chat Header Component - Displays chat header with back button, avatar, and actions
import React from 'react';
import {
  ChevronLeft,
  X,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import type { ChatbotConfig, ActiveScreen } from '@/types';
import { AVATARS } from '@/constants/urls';
import { SecureImage } from '../common';

export interface ChatHeaderProps {
  onBack?: () => void;
  isFreePlan?: boolean;
  isAdmin: boolean;
  adminTestingMode: boolean;
  onNavigate: (screen: ActiveScreen) => void;
  setWindowWidth: React.Dispatch<React.SetStateAction<string>>;
  setMaxScreen: React.Dispatch<React.SetStateAction<boolean>>;
  supportName: string;
  supportImage: string | null;
  isSpeakingWithRealPerson: boolean;
  isConversationClosed: boolean;
  isConversationActive: boolean;
  maxScreen: boolean;
  closeChatPopup: boolean;
  setCloseChatPopup: React.Dispatch<React.SetStateAction<boolean>>;
  handleCloseChat: () => void;
  chatbot_config: ChatbotConfig;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onBack,
  isFreePlan,
  isAdmin,
  onNavigate,
  setWindowWidth,
  setMaxScreen,
  supportName,
  supportImage,
  isSpeakingWithRealPerson,
  isConversationClosed,
  isConversationActive,
  maxScreen,
  closeChatPopup,
  setCloseChatPopup,
  handleCloseChat,
  chatbot_config,
  adminTestingMode,
}) => {
  const handleMaxScreen = () => {
    setMaxScreen(true);
    setWindowWidth('700px');
  };

  const handleMinScreen = () => {
    setMaxScreen(false);
    setWindowWidth('400px');
  };

  const getStatusText = (): string => {
    if (isConversationClosed) return 'Conversation Closed';
    if (!isConversationActive) return 'Conversation Expired';
    if (isSpeakingWithRealPerson) return 'Connected to Support';
    return 'Connected to chatbot';
  };

  const getAvatarSrc = (): string => {
    if (isSpeakingWithRealPerson) {
      return supportImage || AVATARS.SUPPORT;
    }
    return AVATARS.BOT;
  };

  return (
    <div className='chat-header'>
      <div className='contact-info'>
        {onBack && !adminTestingMode && (
          <div
            onClick={() => {
              if (isFreePlan || isAdmin) {
                onNavigate('home');
              } else {
                setWindowWidth('400px');
                setMaxScreen(false);
                onBack();
              }
            }}
            style={{
              cursor: 'pointer',
              height: 36,
              width: 36,
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={18} />
          </div>
        )}
        <div className='avatar'>
          <SecureImage src={getAvatarSrc()} alt={isSpeakingWithRealPerson ? supportName : 'bot'} />
        </div>
        <div className='contact-details'>
          <div className='name'>{supportName}</div>
          <div className='status'>{getStatusText()}</div>
        </div>
      </div>
      <div className='header-actions'>
        {maxScreen ? (
          <button
            onClick={handleMinScreen}
            className='header-btn-extend'
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
            }}
          >
            <Minimize2 size={18} />
          </button>
        ) : (
          <button
            onClick={handleMaxScreen}
            className='header-btn-extend'
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
            }}
          >
            <Maximize2 size={18} />
          </button>
        )}
        {isSpeakingWithRealPerson && isConversationActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCloseChatPopup((prev) => !prev);
            }}
            style={{ position: 'relative', color: 'var(--text-primary)' }}
            className='header-btn'
          >
            <X size={18} />
            {closeChatPopup && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '40px',
                  width: '200px',
                  right: '0',
                  background: '#fff',
                  padding: '10px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  zIndex: 100,
                }}
              >
                <p style={{ margin: 0, color: 'black', marginBottom: '8px' }}>
                  Are you sure you want to close the chat?
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <button
                    onClick={handleCloseChat}
                    className='submit-form-btn'
                    style={{
                      ['--primary-color' as any]: chatbot_config.primaryColor,
                      padding: '10px ',
                      height: 'auto',
                    }}
                  >
                    Close the Chat
                  </button>
                </div>
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// Memoize ChatHeader to prevent re-renders when props haven't changed
export default React.memo(ChatHeader);
