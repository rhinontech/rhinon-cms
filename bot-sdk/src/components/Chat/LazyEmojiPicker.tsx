// Lazy Emoji Picker Component - Dynamically loads emoji-picker-react only when needed
import React, { lazy, Suspense } from 'react';
import { Loader } from '@/components/common';

// Lazy load the emoji picker (saves ~200KB from initial bundle)
const EmojiPicker = lazy(() => import('emoji-picker-react'));

export interface LazyEmojiPickerProps {
  onEmojiClick: (emojiData: { emoji: string }) => void;
  show: boolean;
}

export const LazyEmojiPicker: React.FC<LazyEmojiPickerProps> = ({
  onEmojiClick,
  show,
}) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '60px',
        right: '20px',
        zIndex: 1000,
        transform: 'scale(0.8)',
        transformOrigin: 'bottom right',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Suspense
        fallback={
          <div
            style={{
              width: '320px',
              height: '400px',
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <Loader />
          </div>
        }
      >
        <EmojiPicker onEmojiClick={onEmojiClick} />
      </Suspense>
    </div>
  );
};

export default LazyEmojiPicker;
