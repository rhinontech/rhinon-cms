/**
 * Loader - Loading spinner component
 */
import React from 'react';
import { motion } from 'motion/react';
import './Loader.scss';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
}

export const Loader: React.FC<LoaderProps> = ({ size = 'medium' }) => {
  return (
    <div className={`container loader-${size}`}>
      <motion.div
        className="spinner"
        animate={{ rotate: [0, 360] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

export default Loader;
