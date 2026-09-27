import Link from "next/link";
import { ArrowRight, BadgeCheck, Linkedin, ShieldCheck } from "lucide-react";
import type { EventDetailModel } from "../../shared/model";
import { CATEGORY_CONFIG } from "../../shared/categoryConfig";
import CertificatePreview from "../../shared/CertificatePreview";

/**
 * Real certificates for real upcoming events, fanned out — the assessed one in
 * front. Hidden when nothing scheduled awards one.
 */
export default function CertificateShowcase({ upcoming }: { upcoming: EventDetailModel[] }) {
  const completion = upcoming.find((e) => CATEGORY_CONFIG[e.category].certificate === "completion");
  const participation = upcoming.find((e) => CATEGORY_CONFIG[e.category].certificate === "participation");
  const front = completion ?? participation;
  if (!front) return null;
  const back = completion && participation ? participation : undefined;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-tr from-[#021338] via-[#052b82] to-[#0d59eb] px-6 py-14 sm:px-14 sm:py-16 shadow-[0_40px_90px_-40px_rgba(5,43,130,0.7)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_left,black,transparent_70%)]"
        />
        <div aria-hidden className="pointer-events-none absolute -right-32 -bottom-40 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.3),transparent_65%)]" />

        <div className="relative grid lg:grid-cols-2 gap-14 items-center">
          <div className="text-white">
            <p className="text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-[#8FB8FF]">Certificates</p>
            <h2 className="mt-3 text-3xl sm:text-[40px] font-extrabold tracking-tight leading-[1.1]">
              Proof you built something, <span className="font-serif italic font-normal">not just that you showed up.</span>
            </h2>
            <p className="mt-5 text-[15px] sm:text-base text-white/75 leading-relaxed max-w-lg">
              Micro-certificates are awarded only after a live review of what you shipped. Workshops and build days
              issue a certificate of participation. Every one carries an ID anyone can verify.
            </p>
            <ul className="mt-8 space-y-3.5">
              {[
                { icon: BadgeCheck, text: "Assessed micro-certificates, reviewed live" },
                { icon: ShieldCheck, text: "A unique ID on every certificate" },
                { icon: Linkedin, text: "Add it to LinkedIn in one click" },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-[15px] text-white/90">
                  <span className="grid place-items-center w-8 h-8 rounded-lg bg-white/10 border border-white/15">
                    <item.icon className="w-4 h-4 text-[#8FB8FF]" aria-hidden />
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
            <Link
              href={`/events/${front.slug}`}
              className="mt-10 inline-flex items-center gap-2 bg-white hover:bg-[#EBF3FF] text-[#0B1B3D] font-bold text-xs sm:text-[13px] tracking-wider uppercase px-7 py-3.5 rounded-[4px] transition-colors"
            >
              See the {CATEGORY_CONFIG[front.category].label.toLowerCase()} <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>

          <div className="relative pb-6 sm:pb-10">
            {back ? (
              <div aria-hidden className="absolute inset-x-6 -top-2 sm:-top-6 rotate-[5deg] opacity-80 scale-[0.94]">
                <CertificatePreview event={back} config={CATEGORY_CONFIG[back.category]} />
              </div>
            ) : null}
            <div className="relative -rotate-[2deg]">
              <CertificatePreview event={front} config={CATEGORY_CONFIG[front.category]} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
