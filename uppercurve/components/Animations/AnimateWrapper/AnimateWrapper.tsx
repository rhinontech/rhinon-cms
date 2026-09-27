"use client";

import React, { useState, useEffect, useRef } from "react";

export interface AnimateWrapperProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  /** Vertical starting offset (number in px or CSS string). Default: 30 */
  yOffset?: number | string;
  /** Horizontal starting offset (number in px or CSS string). Default: 0 */
  xOffset?: number | string;
  /** Transition duration in milliseconds. Default: 700 */
  durationMs?: number;
  /** Transition delay in milliseconds. Default: 0 */
  delayMs?: number;
  /** Viewport intersection threshold (0.0 to 1.0). Default: 0.15 */
  threshold?: number;
  /** Trigger animation only once when visible. Default: true */
  once?: boolean;
  /** Custom CSS easing function. Default: "cubic-bezier(0.215, 0.61, 0.355, 1)" */
  easing?: string;
}

export function AnimateWrapper({
  children,
  className = "w-full",
  as: Component = "div",
  yOffset = 30,
  xOffset = 0,
  durationMs = 700,
  delayMs = 0,
  threshold = 0.15,
  once = true,
  easing = "cubic-bezier(0.215, 0.61, 0.355, 1)",
  style,
  ...restProps
}: AnimateWrapperProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, once]);

  const formattedY = typeof yOffset === "number" ? `${yOffset}px` : (isNaN(Number(yOffset)) ? yOffset : `${yOffset}px`);
  const formattedX = typeof xOffset === "number" ? `${xOffset}px` : (isNaN(Number(xOffset)) ? xOffset : `${xOffset}px`);

  const animatedStyle: React.CSSProperties = {
    ...style,
    opacity: isVisible ? 1 : 0,
    transform: isVisible
      ? "translate3d(0, 0, 0)"
      : `translate3d(${formattedX}, ${formattedY}, 0)`,
    transition: `opacity ${durationMs}ms ${easing} ${delayMs}ms, transform ${durationMs}ms ${easing} ${delayMs}ms`,
    willChange: "opacity, transform",
  };

  return (
    <Component ref={ref} className={className} style={animatedStyle} {...restProps}>
      {children}
    </Component>
  );
}

export default AnimateWrapper;
