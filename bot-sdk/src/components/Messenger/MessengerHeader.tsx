/**
 * MessengerHeader - Header with minimize button
 */
import React from 'react';
import { Minus } from 'lucide-react';

interface MessengerHeaderProps {
  onClose: () => void;
}

export const MessengerHeader: React.FC<MessengerHeaderProps> = ({ onClose }) => {
  return (
    <div className='chat-bot-header'>
      <button className='chat-bot-header-button' onClick={onClose}>
        <Minus />
      </button>
    </div>
  );
};

export default MessengerHeader;
