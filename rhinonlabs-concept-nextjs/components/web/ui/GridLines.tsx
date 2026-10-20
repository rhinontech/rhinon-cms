import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

// The faint 4-column guide lines that run behind every section, with optional "+" ticks.
export default function GridLines({ crosses = false }: { crosses?: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="absolute inset-y-0 w-px bg-sec-line max-[809px]:nth-[n+4]:hidden"
          style={{ left: `calc(var(--wgutter) + var(--col) * ${i})` }}
        />
      ))}
      {crosses && (
        <>
          <Cross style={{ left: "var(--wgutter)", top: 25 }} />
          <Cross style={{ right: "var(--wgutter)", top: 25 }} />
        </>
      )}
    </div>
  );
}

/** A single "+" tick, centred on the point given by `style`. */
export function Cross({ style }: { style?: CSSProperties }) {
  const fromRight = style?.right !== undefined;
  return (
    <span
      aria-hidden="true"
      style={style}
      className={cn(
        "pointer-events-none absolute z-2 size-[11px] -translate-y-1/2 before:absolute before:top-0 before:left-[5px] before:h-[11px] before:w-px before:bg-sec-ink after:absolute after:top-[5px] after:left-0 after:h-px after:w-[11px] after:bg-sec-ink",
        fromRight ? "translate-x-1/2" : "-translate-x-1/2"
      )}
    />
  );
}
