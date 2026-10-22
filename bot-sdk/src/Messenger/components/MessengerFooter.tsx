import { LOGOS } from '@/constants/urls';
// MessengerFooter - Footer component showing "Powered by Rhinon"
import React, { memo } from 'react';

interface MessengerFooterProps {
  effectiveTheme: 'light' | 'dark';
}

export const MessengerFooter: React.FC<MessengerFooterProps> = memo(({ effectiveTheme }) => {
  return (
    <div className='footer'>
      <p>Powered by</p>
      <img
        src={
          effectiveTheme === 'dark'
            ? LOGOS.rhinonWhite
            : LOGOS.primaryDark
        }
        alt='Rhinon Tech'
        style={{ width: 50 }}
        loading='lazy'
      />
    </div>
  );
});

MessengerFooter.displayName = 'MessengerFooter';

export default MessengerFooter;
