import { mono } from "@/components/site/primitives";
import { tools } from "@/lib/data";
import { cn } from "@/lib/utils";

function ToolRow({ hidden }: { hidden?: boolean }) {
  return (
    <div aria-hidden={hidden} className="flex items-center">
      {tools.map((t) => (
        <span
          key={t}
          className="inline-flex items-center pr-[0.7em] font-display text-[clamp(24px,2.8vw,44px)] leading-none font-extrabold whitespace-nowrap uppercase tracking-[-0.035em] [font-stretch:112%]"
        >
          {t}
          <span aria-hidden="true" className="ml-[0.7em] text-[0.42em] text-electric">
            ✦
          </span>
        </span>
      ))}
    </div>
  );
}

/** Infinite marquee of the tools the systems plug into; pauses on hover. */
export default function Ticker() {
  return (
    <section
      data-theme="dark"
      aria-label="Tools we connect"
      className="group/ticker relative grid grid-cols-[auto_1fr] items-center gap-[clamp(16px,3vw,40px)] overflow-hidden border-b border-paper-2/12 bg-ink py-[26px] text-paper-2 max-sm:grid-cols-1 max-sm:gap-3.5"
    >
      <p className={cn(mono, "pl-(--gutter) text-electric max-sm:px-(--gutter) max-sm:[&_br]:hidden")}>
        Plugs into
        <br /> what you use
      </p>
      <div className="overflow-hidden mask-[linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
        <div className="flex w-max animate-marquee group-hover/ticker:[animation-play-state:paused]">
          <ToolRow />
          <ToolRow hidden />
        </div>
      </div>
    </section>
  );
}
