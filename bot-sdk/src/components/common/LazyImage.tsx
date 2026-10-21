// LazyImage - Optimized image component with lazy loading and placeholder
import React, { useState, useEffect, useRef, memo } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  className?: string;
  wrapperClassName?: string;
  showSkeleton?: boolean;
}

/**
 * LazyImage component with:
 * - Native lazy loading
 * - Intersection Observer for progressive loading
 * - Skeleton/placeholder while loading
 * - Error handling with fallback image
 */
export const LazyImage: React.FC<LazyImageProps> = memo(({
  src,
  alt,
  placeholder,
  fallback = 'https://via.placeholder.com/150?text=Image',
  className = '',
  wrapperClassName = '',
  showSkeleton = true,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Use Intersection Observer to detect when image is in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading slightly before it's visible
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const imageSrc = hasError ? fallback : src;

  return (
    <div 
      className={`lazy-image-wrapper ${wrapperClassName}`}
      style={{ position: 'relative', overflow: 'hidden' }}
      ref={imgRef}
    >
      {/* Skeleton/Placeholder */}
      {showSkeleton && !isLoaded && (
        <div 
          className="lazy-image-skeleton"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      )}
      
      {/* Actual Image */}
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          className={`lazy-image ${className} ${isLoaded ? 'loaded' : 'loading'}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
          {...props}
        />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

// Add keyframes for skeleton animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  .lazy-image-wrapper {
    display: inline-block;
  }
  
  .lazy-image.loading {
    opacity: 0;
  }
  
  .lazy-image.loaded {
    opacity: 1;
  }
`;

// Only add styles once
if (!document.querySelector('#lazy-image-styles')) {
  styleSheet.id = 'lazy-image-styles';
  document.head.appendChild(styleSheet);
}

export default LazyImage;
