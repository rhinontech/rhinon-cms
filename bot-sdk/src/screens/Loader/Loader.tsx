import React from "react";
import { motion } from "motion/react";
import './Loader.scss'

const LoadingCircleSpinner = () => {
  return (
    <div className="container">
      <motion.div
        className="spinner"
        animate={{ rotate: [0, 360] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    
    </div>
  );
};

export default LoadingCircleSpinner;