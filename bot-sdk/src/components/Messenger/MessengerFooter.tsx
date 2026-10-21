import { LOGOS } from '@/constants/urls';
/**
 * MessengerFooter - Powered by Rhinon footer
 */
import React from 'react';

interface MessengerFooterProps {
  theme: 'light' | 'dark';
}

export const MessengerFooter: React.FC<MessengerFooterProps> = ({ theme }) => {
  const logoSrc = theme === 'dark'
            ? LOGOS.rhinonWhite
            : LOGOS.primaryDark;

  return (
    <div className='footer'>
      <p>Powered by</p>
      <img
        src={logoSrc}
        alt='Rhinon Tech'
        style={{ width: 50 }}
      />
    </div>
  );
};

export default MessengerFooter;
