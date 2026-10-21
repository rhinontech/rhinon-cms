/**
 * MessengerButton - The floating chat toggle button
 */
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import type { ChatbotConfig } from '@/types';
import { resolveS3Key, getInitialSrc } from '@/utils/s3KeyResolver';

interface MessengerButtonProps {
  isOpen: boolean;
  isAdmin: boolean;
  chatbotConfig: ChatbotConfig;
  onToggle: () => void;
  onClose: () => void;
}

export const MessengerButton: React.FC<MessengerButtonProps> = ({
  isOpen,
  isAdmin,
  chatbotConfig,
  onToggle,
  onClose,
}) => {
  const [resolvedLogo, setResolvedLogo] = useState<string>(() => getInitialSrc(chatbotConfig?.primaryLogo));

  // Resolve S3 key for logo
  useEffect(() => {
    const resolveLogo = async () => {
      if (chatbotConfig?.primaryLogo) {
        const resolved = await resolveS3Key(chatbotConfig.primaryLogo, null);
        setResolvedLogo(resolved);
      }
    };
    resolveLogo();
  }, [chatbotConfig?.primaryLogo]);

  return (
    <motion.button
      style={{ ['--primary-color' as any]: chatbotConfig?.primaryColor }}
      className={`chat-button ${!isAdmin && isOpen ? '' : ''}`}
      onClick={isAdmin ? undefined : isOpen ? onClose : onToggle}
      disabled={isAdmin}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {!isAdmin && isOpen ? (
        <X size={24} color='#fff' />
      ) : (
        <img
          src={resolvedLogo || chatbotConfig?.primaryLogo}
          alt='Chat icon'
          style={{ width: '32px', height: '32px', objectFit: 'fill' }}
        />
      )}
    </motion.button>
  );
};

export default MessengerButton;
