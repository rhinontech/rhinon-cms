'use client';

import { Boxes } from 'lucide-react';
import { useState } from 'react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  darkFallback?: boolean;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle = 'RhinonLabs',
  fallbackSubtitle = 'AI-Native Product Engineering',
  darkFallback = false,
}: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center text-center p-6 ${
          darkFallback
            ? 'bg-gradient-to-br from-obsidian via-obsidian-surface to-brand-violet/20 text-dark-on-surface border border-dark-outline-variant'
            : 'bg-gradient-to-br from-off-white via-light-surface-container to-brand-violet/10 text-ink-primary border border-border-subtle'
        } ${className}`}
      >
        <Boxes className="w-8 h-8 text-brand-violet mb-2" aria-hidden="true" />
        <span className="font-headline text-title-md">{fallbackTitle}</span>
        {fallbackSubtitle && (
          <span
            className={`font-body text-body-sm mt-1 ${
              darkFallback ? 'text-dark-on-surface-variant' : 'text-ink-secondary'
            }`}
          >
            {fallbackSubtitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
