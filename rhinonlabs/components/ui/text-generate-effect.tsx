"use client";
import { useEffect, useRef } from "react";
import { motion, stagger, useAnimate, useInView } from "motion/react";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
  words,
  highlight = [],
  className,
  highlightClassName = "text-blue-500",
  textColor = "text-black dark:text-white",
  filter = true,
  duration = 0.5,
}: {
  words: string;
  highlight?: string[];
  className?: string;
  highlightClassName?: string;
  textColor?: string;
  filter?: boolean;
  duration?: number;
}) => {
  const [scope, animate] = useAnimate();
  const ref = useRef(null);

  const isInView = useInView(ref, { once: true, margin: "-200px" });

  // Split BUT keep <br/> properly
  const parts = words
    .replace(/<br\s*\/?>/gi, " <br/> ")
    .split(" ")
    .filter((x) => x.length > 0);

  useEffect(() => {
    if (!isInView) return;

    animate(
      "span",
      { opacity: 1, filter: filter ? "blur(0px)" : "none" },
      { duration: duration || 1, delay: stagger(0.15) }
    );
  }, [isInView]);

  const renderWords = () => (
    <motion.div ref={scope}>
      {parts.map((part, idx) => {
        // handle line breaks
        if (part === "<br/>") {
          return (
            <br key={"br-" + idx} />
          );
        }

        const isHighlighted = highlight.includes(
          part.replace(/[^a-zA-Z0-9]/g, "")
        );

        return (
          <motion.span
            key={part + idx}
            className={cn(
              "opacity-0",
              isHighlighted ? highlightClassName : textColor
            )}
            style={{ filter: filter ? "blur(10px)" : "none" }}
          >
            {part}
            {" "}
          </motion.span>
        );
      })}
    </motion.div>
  );

  return (
    <div className={cn("", className)}>
      <div ref={ref}>
        <motion.div className="dark:text-white">
          {renderWords()}
        </motion.div>
      </div>
    </div>
  );
};
