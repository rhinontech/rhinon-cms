import { cn } from "@/lib/utils";

// Letters that roll up and get replaced by a copy when the enclosing `group/roll` is hovered.
const roll = "block transition-transform duration-500 ease-expo group-hover/roll:-translate-y-full";

export default function RollText({ text, className }: { text: string; className?: string }) {
  return (
    <span aria-label={text} className={cn("inline-flex overflow-hidden leading-none", className)}>
      {[...text].map((c, i) => {
        const ch = c === " " ? " " : c;
        const delay = { transitionDelay: `${i * 18}ms` };
        return (
          <span key={i} aria-hidden="true" className="relative inline-block h-[1em] overflow-hidden leading-none">
            <span className={roll} style={delay}>
              {ch}
            </span>
            <span className={cn(roll, "absolute top-full left-0")} style={delay}>
              {ch}
            </span>
          </span>
        );
      })}
    </span>
  );
}
