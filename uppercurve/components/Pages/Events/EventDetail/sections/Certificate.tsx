import Image from "next/image";
import { BadgeCheck, Linkedin, ShieldCheck } from "lucide-react";
import CertificatePreview from "../../shared/CertificatePreview";
import type { EventDetailModel } from "../../shared/model";
import type { CategoryConfig } from "../../shared/categoryConfig";
import { Section, SectionHeading } from "../../shared/ui";

export default function CertificateSection({ event, config }: { event: EventDetailModel; config: CategoryConfig }) {
  if (!config.certificate) return null;
  const completion = config.certificate === "completion";

  return (
    <Section id="certificate">
      <SectionHeading
        eyebrow="Certificate"
        title={completion ? "Earn a certificate of completion" : "Get a certificate of participation"}
        description={
          completion
            ? "Awarded after the final live review — proof that you built and shipped, not just that you attended."
            : "Issued to everyone who attends live, with a unique ID anyone can verify."
        }
        accentClass={config.accent.text}
      />

      {/* Full column width: the certificate is the point of this section, so it
          has to be legible, not a thumbnail beside the copy. */}
      <div className="mt-8 rounded-3xl bg-gradient-to-br from-[#EEF4FF] via-[#F5F8FF] to-[#E9F7FB] px-5 py-8 sm:px-12 sm:py-12">
        <div className="mx-auto max-w-[660px]">
          {event.certificateUrl ? (
            <div className="relative aspect-[1.414/1] w-full rounded-xl overflow-hidden shadow-[0_40px_70px_-30px_rgba(11,27,61,0.45)]">
              <Image
                src={event.certificateUrl}
                alt={`Certificate for ${event.title}`}
                fill
                sizes="(min-width: 1024px) 660px, 100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <CertificatePreview event={event} config={config} />
          )}
        </div>
      </div>

      <ul className="mt-6 grid sm:grid-cols-3 gap-3">
        {[
          { icon: ShieldCheck, text: "Unique, verifiable certificate ID" },
          { icon: Linkedin, text: "Add it to LinkedIn in one click" },
          {
            icon: BadgeCheck,
            text: completion ? "Issued within 7 days of your review" : "Emailed within 48 hours",
          },
        ].map((item) => (
          <li key={item.text} className="flex items-center gap-2.5 text-[14px] text-[#334155]">
            <item.icon className={`w-[18px] h-[18px] shrink-0 ${config.accent.text}`} aria-hidden />
            {item.text}
          </li>
        ))}
      </ul>
    </Section>
  );
}
