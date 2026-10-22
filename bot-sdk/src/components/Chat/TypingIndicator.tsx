// Typing Indicator Component - Shows when bot is typing
import React from 'react';
import type { ChatbotConfig } from '@/types';
import { AVATARS } from '@/constants/urls';

export interface TypingIndicatorProps {
  supportImage: string | null;
  chatbot_config: ChatbotConfig;
  typingRef: React.RefObject<HTMLDivElement>;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  supportImage,
  chatbot_config,
  typingRef,
}) => {
  return (
    <div
      ref={typingRef}
      style={{
        ['--primary-color' as any]: chatbot_config.primaryColor,
        ['--secondary-color' as any]: chatbot_config.secondaryColor,
      }}
      className='message bot'
    >
      <div className='message-avatar'>
        <img src={supportImage || AVATARS.BOT} alt='Bot' />
      </div>
      <div className='message-content'>
        <div className='message-bubble'>
          <div className='typing-dots'>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize TypingIndicator to prevent re-renders when props haven't changed
export default React.memo(TypingIndicator);
