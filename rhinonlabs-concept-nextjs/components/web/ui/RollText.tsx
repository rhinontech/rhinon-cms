import type { CSSProperties } from "react";
import styles from "./ui.module.css";

// Letters that roll up and get replaced by a copy when the nearest `.roll-host` is hovered.
export default function RollText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`${styles.roll} ${className ?? ""}`} aria-label={text}>
      {[...text].map((c, i) => {
        const ch = c === " " ? " " : c;
        return (
          <span key={i} className={styles.rollChar} style={{ "--i": i } as CSSProperties} aria-hidden="true">
            <span>{ch}</span>
            <span>{ch}</span>
          </span>
        );
      })}
    </span>
  );
}
