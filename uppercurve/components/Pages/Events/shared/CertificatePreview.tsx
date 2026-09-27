import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import type { EventDetailModel } from "./model";
import type { CategoryConfig } from "./categoryConfig";

/** Deterministic, human-looking certificate number for the preview. */
function certificateId(event: EventDetailModel): string {
  const code = event.category
    .replace(/[a-z]/g, "")
    .slice(0, 3)
    .padEnd(2, "X");
  let hash = 0;
  for (const char of event.slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `UC-${code}-${String(hash % 10000).padStart(4, "0")}`;
}

/**
 * The certificate itself, drawn in HTML so it always carries this event's
 * title, date and host. Sized in container-query units so it scales as one
 * piece, like an image would, at any width.
 */
export default function CertificatePreview({ event, config }: { event: EventDetailModel; config: CategoryConfig }) {
  const kind = config.certificate === "completion" ? "Completion" : "Participation";
  const signer = event.speakers[0];
  const verb = config.certificate === "completion" ? "has successfully completed" : "has participated in";
  // SVG ids are document-global; the landing page shows two certificates at once.
  const ringId = `seal-ring-${event.slug}`;
  const fillId = `seal-fill-${event.slug}`;

  return (
    <div className="[container-type:inline-size] w-full">
      <div className="relative aspect-[1.414/1] w-full bg-white rounded-[1.2cqw] shadow-[0_40px_70px_-30px_rgba(11,27,61,0.45)] ring-1 ring-[#0B1B3D]/10 overflow-hidden">
        {/* Guilloche corners */}
        <div
          aria-hidden
          className="absolute -top-[18cqw] -right-[18cqw] w-[48cqw] h-[48cqw] rounded-full opacity-60 [background:repeating-radial-gradient(circle,transparent_0_0.9cqw,#DCE8FF_0.9cqw_1.05cqw)]"
        />
        <div
          aria-hidden
          className="absolute -bottom-[20cqw] -left-[20cqw] w-[48cqw] h-[48cqw] rounded-full opacity-50 [background:repeating-radial-gradient(circle,transparent_0_0.9cqw,#DCE8FF_0.9cqw_1.05cqw)]"
        />
        {/* Double frame */}
        <div aria-hidden className="absolute inset-[2.2cqw] rounded-[0.6cqw] border-[0.18cqw] border-[#0052FF]/70" />
        <div aria-hidden className="absolute inset-[2.9cqw] rounded-[0.4cqw] border-[0.08cqw] border-[#0B1B3D]/20" />

        <div className="relative h-full flex flex-col px-[7cqw] pt-[6cqw] pb-[5.5cqw]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-[1cqw]">
              <Image
                src="/uppercurve_logo_nav.png"
                alt=""
                width={160}
                height={87}
                className="w-[6cqw] h-auto"
              />
              <span className="text-[2.3cqw] font-extrabold tracking-tight text-[#0B1B3D]">
                UPPER<span className="text-[#0052FF]">CURVE</span>
              </span>
            </div>
            <span className="text-[1.35cqw] font-mono tracking-wider text-[#64748B]">{certificateId(event)}</span>
          </div>

          <div className="mt-[3.6cqw] text-center">
            <p className="text-[4.4cqw] font-extrabold tracking-[0.18em] text-[#0B1B3D] leading-none">CERTIFICATE</p>
            <p className="mt-[1.1cqw] text-[1.6cqw] font-semibold tracking-[0.42em] text-[#0052FF]">
              OF {kind.toUpperCase()}
            </p>
            <p className="mt-[3.4cqw] text-[1.5cqw] text-[#64748B] tracking-wide">This is to certify that</p>
            <p className="mt-[1cqw] font-serif italic text-[5cqw] text-[#0B1B3D] leading-none">Your Name</p>
            <div aria-hidden className="mx-auto mt-[1.3cqw] h-[0.12cqw] w-[38cqw] bg-gradient-to-r from-transparent via-[#0B1B3D]/30 to-transparent" />
            <p className="mt-[1.8cqw] text-[1.5cqw] text-[#64748B]">{verb}</p>
            <p className="mt-[0.8cqw] mx-auto max-w-[70cqw] text-[2.3cqw] font-bold text-[#0B1B3D] leading-snug">
              {event.title}
            </p>
            <p className="mt-[0.8cqw] text-[1.35cqw] text-[#64748B]">
              {config.label} by UpperCurve · {event.dateLabel}
            </p>
          </div>

          <div className="mt-auto flex items-end justify-between">
            <div className="text-left">
              <p className="font-serif italic text-[2.6cqw] text-[#0B1B3D] leading-none">
                {signer?.name ?? "Programme Director"}
              </p>
              <div aria-hidden className="mt-[0.8cqw] h-[0.1cqw] w-[20cqw] bg-[#0B1B3D]/30" />
              <p className="mt-[0.6cqw] text-[1.2cqw] font-semibold text-[#0B1B3D]">{signer?.name ?? "UpperCurve"}</p>
              <p className="text-[1.1cqw] text-[#64748B]">{signer?.designation || "Programme Director"}</p>
            </div>

            {/* Seal */}
            <div className="relative grid place-items-center w-[11cqw] h-[11cqw]">
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden>
                <defs>
                  <path id={ringId} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
                  <linearGradient id={fillId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0052FF" />
                    <stop offset="100%" stopColor="#00B4D8" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="48" fill={`url(#${fillId})`} />
                <circle cx="50" cy="50" r="43" fill="none" stroke="white" strokeOpacity="0.45" strokeWidth="0.8" />
                <circle cx="50" cy="50" r="29" fill="none" stroke="white" strokeOpacity="0.45" strokeWidth="0.8" />
                <text fill="white" fontSize="8.2" fontWeight="700" letterSpacing="2.4">
                  <textPath href={`#${ringId}`}>UPPERCURVE · VERIFIED · UPPERCURVE · VERIFIED ·</textPath>
                </text>
              </svg>
              <BadgeCheck className="relative w-[4.2cqw] h-[4.2cqw] text-white" aria-hidden />
            </div>

            <div className="text-right">
              <p className="text-[1.6cqw] font-bold text-[#0B1B3D]">{event.dateLabel}</p>
              <div aria-hidden className="mt-[0.8cqw] ml-auto h-[0.1cqw] w-[20cqw] bg-[#0B1B3D]/30" />
              <p className="mt-[0.6cqw] text-[1.2cqw] font-semibold text-[#0B1B3D]">Date of issue</p>
              <p className="text-[1.1cqw] text-[#64748B]">Verify at uppercurve.in/certificates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
