import { Button, ButtonArrow } from "@/components/ui/button";
import FooterMark from "@/components/site/FooterMark";
import Year from "@/components/site/Year";
import { Kicker, LetterRoll, RollLabel, SplitHeading, Wrap, display, mono } from "@/components/site/primitives";
import { siteConfig } from "@/lib/data";
import { cn } from "@/lib/utils";

const colLink = "block w-max max-w-full py-1 text-base";
const colTitle = cn(mono, "mb-3.5 text-paper-2/60");

/** 12 Start here — closing CTA, contact columns and the wordmark. */
export default function Footer() {
  return (
    <footer id="contact" data-theme="dark" className="overflow-hidden bg-ink pt-[clamp(61px,6.6vw,99px)] pb-[26px] text-paper-2">
      <Wrap>
        <Kicker idx="12">Start here</Kicker>
        <SplitHeading
          className={cn(
            display,
            "mb-[clamp(30px,3vw,48px)] text-[clamp(46px,8.4vw,148px)] leading-[0.86] tracking-[-0.045em] [&_em]:font-serif [&_em]:text-[1.1em] [&_em]:leading-[0.8] [&_em]:font-normal [&_em]:tracking-[-0.015em] [&_em]:normal-case [&_em]:italic [&_em]:[font-stretch:100%]"
          )}
        >
          Let&rsquo;s build
          <br />
          your <em>system.</em>
        </SplitHeading>
        <div data-reveal="" className="mb-[clamp(64px,8vw,120px)] flex flex-wrap gap-2.5">
          <Button asChild size="lg">
            <a href={siteConfig.bookCall} target="_blank" rel="noopener">
              <RollLabel>Book a free discovery call</RollLabel>
              <ButtonArrow />
            </a>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <a href={siteConfig.whatsapp} target="_blank" rel="noopener">
              <RollLabel>Message on WhatsApp</RollLabel>
            </a>
          </Button>
        </div>

        <div className="grid grid-cols-[repeat(4,1fr)] gap-6 border-t border-paper-2/12 pt-7 max-[1100px]:grid-cols-[repeat(2,1fr)] max-[1100px]:gap-y-8">
          <div>
            <h3 className={colTitle}>Talk</h3>
            <a href={siteConfig.phoneHref} className={colLink}>
              <LetterRoll>{`Call ${siteConfig.phone}`}</LetterRoll>
            </a>
            <a href={`mailto:${siteConfig.email}`} className={colLink}>
              <LetterRoll>{siteConfig.email}</LetterRoll>
            </a>
          </div>
          <div>
            <h3 className={colTitle}>Studio</h3>
            <p className="text-base leading-normal">
              Hyderabad, Telangana
              <br />
              India — working worldwide
            </p>
          </div>
          <div>
            <h3 className={colTitle}>Explore</h3>
            {[
              ["/services", "Services"],
              ["/case-studies", "Case studies"],
              ["/blogs", "Blog"],
            ].map(([path, label]) => (
              <a key={path} href={siteConfig.site + path} target="_blank" rel="noopener" className={colLink}>
                <LetterRoll>{label}</LetterRoll>
              </a>
            ))}
          </div>
          <div>
            <h3 className={colTitle}>Follow</h3>
            {[
              ["https://www.linkedin.com/company/rhinonlabs", "LinkedIn"],
              ["https://x.com/RhinonLabs", "X / Twitter"],
              ["https://www.instagram.com/rhinonlabs/", "Instagram"],
            ].map(([href, label]) => (
              <a key={href} href={href} target="_blank" rel="noopener" className={colLink}>
                <LetterRoll>{label}</LetterRoll>
              </a>
            ))}
          </div>
        </div>

        <FooterMark />

        <div className={cn(mono, "flex flex-wrap justify-between gap-x-4 gap-y-3 border-t border-paper-2/12 pt-[18px] text-paper-2/60")}>
          <span>
            © <Year /> Rhinon Labs
          </span>
          <span>Homepage concept — internal review, not for production</span>
          <a href="#top" className="hover:text-electric">
            Back to top ↑
          </a>
        </div>
      </Wrap>
    </footer>
  );
}
