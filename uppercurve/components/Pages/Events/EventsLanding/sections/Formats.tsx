import Link from "next/link";
import { ArrowRight, Award, BadgeCheck, Hammer, Layers, Presentation, Sparkles, Users } from "lucide-react";
import type { EventCategory, EventDetailModel } from "../../shared/model";
import { CATEGORY_CONFIG } from "../../shared/categoryConfig";
import { SectionHeading } from "../../shared/ui";

const ICONS: Record<EventCategory, typeof Presentation> = {
  Normal: Presentation,
  Community: Users,
  MicroCertificate: BadgeCheck,
  GenAiMicroCertificate: Sparkles,
  Claude: Layers,
  ClaudeOneDay: Hammer,
  InternalCohort: Users,
};

const PUBLIC_FORMATS: EventCategory[] = [
  "Normal",
  "MicroCertificate",
  "GenAiMicroCertificate",
  "Claude",
  "ClaudeOneDay",
  "Community",
];

/** Every format we run, including ones with nothing scheduled right now. */
export default function Formats({ upcoming }: { upcoming: EventDetailModel[] }) {
  return (
    <section className="bg-[#F8FAFC] border-y border-[#EEF1F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
        <SectionHeading
          align="center"
          eyebrow="Formats"
          title="Six ways to learn, one standard"
          description="Every format is live, hands-on and free. Pick the depth that fits — an evening, an assessed programme, or a full build day."
        />
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PUBLIC_FORMATS.map((category) => {
            const config = CATEGORY_CONFIG[category];
            const Icon = ICONS[category];
            const count = upcoming.filter((e) => e.category === category).length;
            return (
              <Link
                key={category}
                href={count ? `/events?format=${category}#events` : "#events"}
                className="group relative flex flex-col rounded-[22px] bg-white border border-[#E6EAF2] p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_28px_50px_-30px_rgba(11,27,61,0.35)]"
              >
                <div className="flex items-start justify-between">
                  <span className={`grid place-items-center w-12 h-12 rounded-2xl ${config.accent.soft}`}>
                    <Icon className={`w-[22px] h-[22px] ${config.accent.text}`} aria-hidden />
                  </span>
                  {config.certificate ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 text-[11px] font-semibold text-[#475569]">
                      <Award className="w-3 h-3" aria-hidden />
                      {config.certificate === "completion" ? "Assessed certificate" : "Certificate"}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-6 text-[19px] font-extrabold text-[#0B1B3D] tracking-tight">{config.label}</h3>
                <p className="mt-2 text-[14.5px] text-[#475569] leading-relaxed">{config.summary}</p>
                <div className="mt-auto pt-6 flex items-center justify-between text-[12.5px]">
                  <span className="font-semibold text-[#94A3B8] tracking-wide">{config.formatLength}</span>
                  <span className={`inline-flex items-center gap-1 font-bold ${count ? config.accent.text : "text-[#94A3B8]"}`}>
                    {count ? `${count} upcoming` : "Coming soon"}
                    {count ? <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden /> : null}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
