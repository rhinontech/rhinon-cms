import { cn } from "@/lib/utils";

// "● 03  WHY US?" section label.
export default function Eyebrow({ index, label, className }: { index?: string; label: string; className?: string }) {
  return (
    <p className={cn("flex items-center gap-1.5 font-mono text-xs leading-none font-medium tracking-[-0.02em] text-sec-muted uppercase", className)}>
      <span className="size-1.5 rounded-full bg-sec-ink" />
      {index && <span className="mr-1.5 text-sec-ink">{index}</span>}
      <span>{label}</span>
    </p>
  );
}
