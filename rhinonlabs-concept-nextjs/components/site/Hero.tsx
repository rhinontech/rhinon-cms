import { Button } from "@/components/ui/button";
import { RollLabel, display, mono } from "@/components/site/primitives";
import { siteConfig } from "@/lib/data";
import { cn } from "@/lib/utils";

const avatars = [1, 2, 3, 4, 5].map((n) => `/img/hero/avatar-${n}.jpg`);
const clients = [1, 2, 3, 4, 5].map((n) => `/img/hero/client-${n}.svg`);

/** Each letter rises out of its word's mask, staggered across the line. */
function Letters({ text, delay }: { text: string; delay: number }) {
  return text.split(" ").map((word, wi) => (
    <span key={wi} className="mr-[0.22em] inline-block overflow-hidden pb-[0.04em] last:mr-0">
      {[...word].map((c, ci) => (
        <span
          key={ci}
          className="inline-block animate-letter"
          style={{ animationDelay: `${delay + (wi * 4 + ci) * 0.035}s` }}
        >
          {c}
        </span>
      ))}
    </span>
  ));
}

export default function Hero() {
  const title = "Scale your";
  const subtitle = "operations, not your headcount.";

  return (
    <section
      id="top"
      data-theme="light"
      className="relative min-h-[max(100svh,860px)] overflow-hidden pt-[200px] [--col:calc((100vw-var(--gutter)*2)/4)] pb-[60px] max-[809px]:min-h-0 max-[809px]:pt-[140px]"
    >
      {/* Mascot: the curtain lifts and the image settles from a zoom. Multiply
          drops its white background into the paper. */}
      <div className="absolute inset-y-0 left-0 w-[41vw] overflow-hidden mix-blend-multiply max-[809px]:inset-auto max-[809px]:top-[76px] max-[809px]:right-(--gutter) max-[809px]:h-[50vw] max-[809px]:w-[38vw]">
        <img
          src="/img/hero/hero-mascot.jpg"
          alt="Rhinon Labs mascot — a robot rhino waving"
          className="size-full animate-settle object-cover object-[center_35%] brightness-106 contrast-106 max-[809px]:object-contain max-[809px]:object-top-right"
        />
        <span aria-hidden="true" className="absolute inset-0 origin-top animate-curtain bg-paper" />
      </div>

      <div className="relative px-(--gutter)">
        <div
          className={cn(
            mono,
            "mb-11 ml-[calc(var(--col)*2)] flex animate-rise items-center gap-3.5 text-ink/58 [animation-delay:0.2s] max-[809px]:ml-0 max-[809px]:flex-col max-[809px]:items-start"
          )}
        >
          <div className="flex">
            {avatars.map((src, i) => (
              <span
                key={src}
                className="-mr-3 size-[34px] animate-pop overflow-hidden rounded-full border-2 border-paper bg-paper last:mr-0"
                style={{ animationDelay: `${0.35 + i * 0.07}s` }}
              >
                <img src={src} alt="" className="size-full object-cover" />
              </span>
            ))}
          </div>
          <div>
            <p className="mb-0.5 flex items-center gap-2">
              <span aria-hidden="true" className="inline-flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <i key={i} className="size-[5px] rounded-full bg-ink" />
                ))}
              </span>
              <strong className="font-medium text-ink">20+</strong>
            </p>
            <p>
              Trusted by <strong className="font-medium text-ink">startups and SMBs worldwide</strong>
            </p>
          </div>
        </div>

        <h1 aria-label={`${title} ${subtitle}`}>
          {/* White + difference blend: ink over paper, knocked out over the mascot */}
          <span
            aria-hidden="true"
            className={cn(
              display,
              "block text-[12.9vw] leading-[0.85] tracking-[-0.05em] whitespace-nowrap text-white mix-blend-difference max-[809px]:text-[15vw] max-[809px]:leading-[0.88] max-[809px]:whitespace-normal"
            )}
          >
            <Letters text={title} delay={0.3} />
          </span>
        </h1>
        <p
          aria-hidden="true"
          className={cn(
            display,
            "mt-[0.1em] ml-[calc(var(--col)*2)] max-w-[calc(var(--col)*2)] text-[3.3vw] leading-none tracking-[-0.07em] text-ink max-[809px]:ml-0 max-[809px]:max-w-none max-[809px]:text-[7.4vw]"
          )}
        >
          <Letters text={subtitle} delay={0.65} />
        </p>

        <p className="mt-12 ml-[calc(var(--col)*2)] max-w-[640px] animate-blur-in text-[22px] leading-[1.35] font-medium tracking-[-0.03em] text-ink/58 [animation-delay:1s] max-[1199px]:text-xl max-[809px]:mt-6 max-[809px]:ml-0 max-[809px]:text-[17px]">
          We design and build custom AI workflows, automations, and internal dashboards that{" "}
          <strong className="font-medium text-ink">reduce manual work</strong> and help your team work faster and
          smarter.
        </p>

        <div className="mt-16 grid animate-slide-up grid-cols-2 gap-2.5 [animation-delay:0.1s] max-[809px]:mt-10 max-[809px]:grid-cols-1">
          <Button asChild size="lg" className="w-full">
            <a href={siteConfig.bookCall} target="_blank" rel="noopener">
              <RollLabel>Book a free discovery call</RollLabel>
            </a>
          </Button>
          <Button asChild size="lg" variant="light" className="w-full">
            <a href="#build">
              <RollLabel>See what we build</RollLabel>
            </a>
          </Button>
        </div>

        <div className="mt-[60px] ml-[calc(var(--col)*2)] w-(--col) animate-fade overflow-hidden [animation-delay:1.2s] mask-[linear-gradient(90deg,transparent,#000_18%,#000_82%,transparent)] max-[809px]:ml-0 max-[809px]:w-full">
          <div className="flex w-max animate-logos gap-[60px] motion-reduce:animate-none">
            {[...clients, ...clients].map((src, i) => (
              <img key={i} src={src} alt="" aria-hidden={i >= clients.length} className="h-8 w-auto opacity-75" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
