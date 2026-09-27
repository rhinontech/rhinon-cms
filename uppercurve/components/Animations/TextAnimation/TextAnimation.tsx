"use client";

import React, { useState, useEffect, useRef } from "react";

interface TextAnimationProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  staggerMs?: number;
  threshold?: number;
}

export function TextAnimation({
  children,
  className = "",
  as: Component = "span",
  staggerMs = 80,
  threshold = 0.2,
}: TextAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  const tokens: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      const parts = String(child).split(/(\s+)/);
      parts.forEach((part) => {
        if (part) {
          tokens.push(part);
        }
      });
    } else if (child !== null && child !== undefined) {
      tokens.push(child);
    }
  });

  return (
    <Component ref={ref} className={`inline-block ${className}`}>
      {tokens.map((token, idx) => (
        <span
          key={idx}
          className="inline-block whitespace-pre transition-all duration-500 ease-out"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(12px)",
            transitionDelay: `${idx * staggerMs}ms`,
          }}
        >
          {token}
        </span>
      ))}
    </Component>
  );
}

export default TextAnimation;
