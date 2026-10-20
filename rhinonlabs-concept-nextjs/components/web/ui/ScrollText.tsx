"use client";

import { Fragment, useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";

type Offset = NonNullable<Parameters<typeof useScroll>[0]>["offset"];

function Char({ char, progress, range }: { char: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.22, 1]);
  return <motion.span style={{ opacity }}>{char}</motion.span>;
}

type Props = {
  text: string;
  as?: "p" | "h2" | "blockquote";
  className?: string;
  offset?: Offset;
};

// Large statement whose letters "ink in" one by one as you scroll through it.
export default function ScrollText({ text, as = "p", className, offset = ["start 0.85", "end 0.45"] }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const Tag = as;
  const total = text.length;
  let index = 0;

  return (
    <Tag ref={ref as React.Ref<never>} className={className} aria-label={text}>
      {text.split(" ").map((word, wi) => (
        <Fragment key={wi}>
          {wi > 0 && " "}
          <span aria-hidden="true" className="inline-block">
            {[...word].map((char, ci) => {
              const start = index / total;
              index += 1;
              return <Char key={ci} char={char} progress={scrollYProgress} range={[start, Math.min(1, start + 12 / total)]} />;
            })}
          </span>
        </Fragment>
      ))}
    </Tag>
  );
}
