// ChatButton - Floating chat button component
import React, { memo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { LOGOS } from '@/constants/urls';
import type { ChatbotConfig } from '@/types';
import { AVATARS } from '@/constants/urls';
import { resolveS3Key, getInitialSrc } from '@/utils/s3KeyResolver';

interface ChatButtonProps {
  chatbot_config: ChatbotConfig;
  isOpen: boolean;
  isAdmin: boolean;
  freePlan: boolean;
  isApiKeyProvided: boolean;
  onToggle: () => void;
  onClose: () => void;
  showNotification: boolean;
}

export const ChatButton: React.FC<ChatButtonProps> = memo(({
  chatbot_config,
  isOpen,
  isAdmin,
  freePlan,
  isApiKeyProvided,
  onToggle,
  onClose,
  showNotification,
}) => {
  const [resolvedLogo, setResolvedLogo] = useState<string>(() => getInitialSrc(chatbot_config.primaryLogo));

  // Resolve S3 key for logo
  useEffect(() => {
    const resolveLogo = async () => {
      if (chatbot_config.primaryLogo) {
        const resolved = await resolveS3Key(chatbot_config.primaryLogo, null);
        setResolvedLogo(resolved);
      }
    };
    resolveLogo();
  }, [chatbot_config.primaryLogo]);

  // Appearance → Launcher icon, in place of the logo.
  const [launcherIcon, setLauncherIcon] = useState<string>(() => getInitialSrc(chatbot_config.launcherIcon));
  useEffect(() => {
    if (!chatbot_config.launcherIcon) return setLauncherIcon('');
    resolveS3Key(chatbot_config.launcherIcon, null).then(setLauncherIcon);
  }, [chatbot_config.launcherIcon]);

  const defaultLogos: string[] = [LOGOS.primaryLight, LOGOS.primaryDark, LOGOS.rhinonWhite];
  const hasCustomLogo = !!chatbot_config.primaryLogo && !defaultLogos.includes(chatbot_config.primaryLogo);

  // Hide button if free plan + no API key
  if (freePlan && !isApiKeyProvided) {
    return null;
  }

  const buttonLabel = isOpen ? 'Close chat' : 'Open chat';

  return (
    <motion.button
      style={{ ['--primary-color' as string]: chatbot_config.primaryColor }}
      className='chat-button'
      onClick={isAdmin ? undefined : isOpen ? onClose : onToggle}
      disabled={isAdmin}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={buttonLabel}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      role="button"
    >
      {(showNotification && !isOpen) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: 'red',
            zIndex: 10,
          }}
        />
      )}


      {!isAdmin && isOpen ? (
        <X size={24} color='#fff' aria-hidden="true" />
      ) : launcherIcon ? (
        <img className='chat-button-icon' src={launcherIcon} alt={`${chatbot_config.chatbotName || 'Chat'} icon`} />
      ) : hasCustomLogo ? (
        <img
          src={resolvedLogo || chatbot_config.primaryLogo}
          alt={`${chatbot_config.chatbotName || 'Chat'} icon`}
          style={{ width: '32px', height: '32px', objectFit: 'contain' }}
        />
      ) : (
        // Nothing uploaded: the default launcher icon Appearance shows.
        <img className='chat-button-icon' src={AVATARS.BOT} alt='' aria-hidden="true" />
      )}
    </motion.button>
  );
});

ChatButton.displayName = 'ChatButton';

export default ChatButton;
