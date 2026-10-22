import React, { useRef, useEffect } from 'react';

import { motion } from "motion/react"

interface CloudWaveProps {
  isListening: boolean;
}

const CloudWave: React.FC<CloudWaveProps> = ({
  isListening,
}) => {
  const circleRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const containerStyle = {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    background: 'linear-gradient(to bottom, #d8b4fe, #a78bfa, #818cf8, #3b82f6)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const bounceAnimation = {
    scale: [1, 1.2, 1], // Bounces from normal to larger and back to normal
    transition: {
      duration: 1, // The total time for one full bounce cycle
      ease: "easeInOut",
      repeat: Infinity, // Repeats the animation forever
      repeatType: "loop",
    },
  };

  useEffect(() => {
    const animateWave = () => {
      if (circleRef.current) {
        // Generate a random scale factor between 0.8 and 1.4
        const scale = 0.8 + Math.random() * 0.6;
        circleRef.current.style.transform = `scale(${scale})`;
      }

      // Keep animating
      animationRef.current = requestAnimationFrame(animateWave);
    };

    animateWave();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);



  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        padding: '0px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '250px',
          width: '250px',
        }}
      >
        <div style={{ padding: '20px', position: 'relative' }}>
          {/* Glowing background */}
          <motion.div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(122,154,255,0.6), transparent 90%)',
              filter: 'blur(30px)',
              zIndex: 0,
            }}
            initial={{ x: '-50%', y: '-50%' }}
            animate={
              isListening
                ? {
                  scale: [1, 1.4, 1],
                  opacity: [0.7, 1, 0.7],
                  transition: {
                    duration: 1.5,
                    ease: 'easeInOut',
                    repeat: Infinity,
                    repeatType: 'loop',
                  },
                }
                : { scale: 1, opacity: 0.7 }
            }
          />

          {/* Main ball */}
          <motion.div
            style={{
              ...containerStyle,
              position: 'relative',
              zIndex: 1,
              boxShadow: '0 0 30px rgba(122,154,255,0.4)',
            }}
            animate={{
              rotate: 360, // always spinning
              scale: isListening ? [1, 1.2, 1] : 1, // bounce only when listening
            }}
            transition={{
              rotate: {
                repeat: Infinity,
                duration: 4, // adjust for speed (smaller = faster)
                ease: 'linear',
              },
              scale: isListening
                ? {
                  duration: 1,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatType: 'loop',
                }
                : { duration: 0 },
            }}
          ></motion.div>
        </div>
      </div>

    </div>
  );
};

export default CloudWave;
