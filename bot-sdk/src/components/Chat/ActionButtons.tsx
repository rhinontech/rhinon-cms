// Action Buttons Component - Shows contextual action buttons
import React from 'react';
import type { Message, WhatsAppConfig } from '@/types';

export interface ActionButtonsProps {
  isConversationActive: boolean;
  isAdmin: boolean;
  isSpeakingWithRealPerson: boolean;
  reachedLimit: boolean;
  chatMessages: Message[];
  handleSwitchToRealPerson: () => void;
  setOpenTicket: React.Dispatch<React.SetStateAction<boolean>>;
  startNewConversation: () => void;
  loading: boolean;
  adminTestingMode?: boolean;
  whatsappConfig?: WhatsAppConfig;
  onWhatsAppClick?: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isConversationActive,
  isAdmin,
  isSpeakingWithRealPerson,
  reachedLimit,
  chatMessages,
  handleSwitchToRealPerson,
  setOpenTicket,
  startNewConversation,
  loading,
  adminTestingMode,
}) => {
  const shouldShowConnectSupport = 
    !isAdmin &&
    !isSpeakingWithRealPerson &&
    isConversationActive &&
    (reachedLimit || chatMessages.length > 5);

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'end',
        justifyContent: 'end',
        margin: 10,
        marginBottom: '10px',
        flexWrap: 'wrap',
      }}
    >
      {/* Start new conversation button */}
      {!isConversationActive && (
        <div className='hover-card' onClick={startNewConversation}>
          Start New Conversation
        </div>
      )}

      {/* Connect with support button */}
      {shouldShowConnectSupport && (
        <button
          disabled={loading}
          style={{
            margin: 0,
            padding: 0,
            border: 'none',
            background: 'none',
          }}
          onClick={handleSwitchToRealPerson}
        >
          <div className='hover-card' style={{ fontSize: '14px' }}>
            Connect With Support
          </div>
        </button>
      )}

      {/* Raise ticket button */}
      {!adminTestingMode && (
        <div
          className='hover-card'
          onClick={() => setOpenTicket(true)}
          style={{ fontSize: '14px' }}
        >
          Raise a ticket
        </div>
      )}
    </div>
  );
};

export default ActionButtons;
