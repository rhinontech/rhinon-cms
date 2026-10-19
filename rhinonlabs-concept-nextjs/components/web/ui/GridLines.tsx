import type { CSSProperties } from "react";
import styles from "./ui.module.css";

// The faint 4-column guide lines that run behind every section, with optional "+" ticks.
export default function GridLines({ crosses = false }: { crosses?: boolean }) {
  return (
    <div className={styles.grid} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={styles.gridLine} style={{ "--i": i } as CSSProperties} />
      ))}
      {crosses && (
        <>
          <Cross style={{ left: "var(--gutter)", top: 25 }} />
          <Cross style={{ right: "var(--gutter)", top: 25 }} />
        </>
      )}
    </div>
  );
}

/** A single "+" tick, centred on the point given by `style`. */
export function Cross({ style }: { style?: CSSProperties }) {
  return <span className={styles.cross} style={style} aria-hidden="true" />;
}
