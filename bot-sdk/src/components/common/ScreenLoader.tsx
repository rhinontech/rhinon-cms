/**
 * ScreenLoader - Suspense wrapper for lazy loaded screens
 * Provides consistent loading state across all screens
 */
import React, { Suspense, ReactNode } from 'react';
import { Loader } from '@/components/common';

interface ScreenLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const DefaultFallback = () => (
  <div
    style={{
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
    }}
  >
    <Loader />
  </div>
);

export const ScreenLoader: React.FC<ScreenLoaderProps> = ({ 
  children, 
  fallback 
}) => {
  return (
    <Suspense fallback={fallback || <DefaultFallback />}>
      {children}
    </Suspense>
  );
};

export default ScreenLoader;
