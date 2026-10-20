import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Kicker, RollLabel, SectionMarks, SplitHeading, Wrap, h2, mono } from "@/components/site/primitives";
import { faqs, pad, siteConfig } from "@/lib/data";
import { cn } from "@/lib/utils";

/** 11 FAQ — sticky intro + contact card beside a single-open accordion. */
export default function Faq() {
  return (
    <section id="faq" data-theme="light" className="relative bg-paper py-[clamp(61px,6.6vw,99px)]">
      <SectionMarks />
      <Wrap className="grid grid-cols-[4fr_8fr] items-start gap-[clamp(36px,6vw,110px)] max-[1100px]:grid-cols-1">
        <div className="sticky top-[104px] max-[1100px]:relative max-[1100px]:top-0">
          <Kicker idx="11">FAQ</Kicker>
          <SplitHeading className={h2}>
            Questions, <em>answered.</em>
          </SplitHeading>
          <div data-reveal="" className="mt-9 flex max-w-[380px] flex-col gap-[18px] rounded-[22px] bg-ink p-6 text-paper-2">
            <p className="text-[17px] leading-[1.4] tracking-[-0.01em]">Still deciding? Talk to the people who&rsquo;ll build it.</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <a href={siteConfig.phoneHref}>
                  <RollLabel>Call us</RollLabel>
                </a>
              </Button>
              <Button asChild size="sm" variant="ghost-light">
                <a href={siteConfig.whatsapp} target="_blank" rel="noopener">
                  <RollLabel>WhatsApp</RollLabel>
                </a>
              </Button>
            </div>
          </div>
        </div>

        <Accordion type="single" collapsible defaultValue="q0">
          {faqs.map(([q, a], i) => (
            <AccordionItem key={q} value={`q${i}`}>
              <AccordionTrigger className="grid-cols-[44px_1fr_22px] py-6 text-[clamp(17px,1.45vw,21px)] leading-[1.3] font-medium tracking-[-0.015em] max-sm:grid-cols-[30px_1fr_18px] max-sm:py-5">
                <span className={cn(mono, "text-ink/58")}>{pad(i + 1)}</span>
                <span>{q}</span>
              </AccordionTrigger>
              <AccordionContent>
                <p className="max-w-[64ch] pb-[26px] pl-14 text-base text-ink/58 max-sm:pl-0">{a}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Wrap>
    </section>
  );
}
