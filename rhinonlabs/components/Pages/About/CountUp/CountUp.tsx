"use client";

import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

export function CountUp({
  target = 100,
  duration = 1,
  className = "",
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true }); // 👈 runs once only

  const count = useMotionValue(0);

  // Round for display
  const rounded = useTransform(count, (latest) => Math.floor(latest));

  useEffect(() => {
    if (!isInView) return; // wait until visible

    animate(count, target, {
      duration,
      ease: "easeOut",
    });
  }, [isInView]);

  return (
    <motion.span ref={ref} className={className}>
      {rounded}
    </motion.span>
  );
}
