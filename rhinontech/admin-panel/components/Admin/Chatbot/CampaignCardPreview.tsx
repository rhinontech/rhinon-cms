"use client";

import { TbMessageCircle, TbX } from "react-icons/tb";
import type { CampaignContent } from "./campaignTemplates";

/**
 * The campaign pop-up as visitors see it, above the launcher. Mirrors the
 * widget's .campaign-card styles (bot-sdk/src/styles/redesign.scss) — same
 * width, radius, image height and button style — so the editor is honest.
 */
export function CampaignCardPreview({ content, accent }: { content: CampaignContent; accent: string }) {
  const showSub = content.layout.includes("subheading") && !!content.subheading;
  return (
    <div className="flex flex-col items-end gap-4">
      <div
        className="w-[300px] overflow-hidden rounded-[18px] border border-slate-900/10 bg-white text-left shadow-[0_24px_48px_-12px_rgba(15,23,42,0.35)]"
        style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
        data-testid="campaign-card-preview"
      >
        <div className="relative">
          <span className="absolute right-2.5 top-2.5 z-10 flex size-[26px] items-center justify-center rounded-full bg-slate-900/55 text-white">
            <TbX size={15} />
          </span>
          {content.hasImage && content.media?.src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={content.media.src} alt="" className="h-40 w-full object-cover" />
          )}
        </div>
        <div className="flex flex-col gap-2.5 p-4">
          <div className="flex flex-col gap-1">
            <h3 className="whitespace-pre-wrap pr-6 text-[15.5px] font-semibold leading-snug tracking-tight text-gray-900">
              {content.heading || <span className="text-gray-400">Your heading</span>}
            </h3>
            {showSub && <p className="whitespace-pre-wrap text-[13.5px] leading-normal text-gray-500">{content.subheading}</p>}
          </div>
          <div className="flex flex-col gap-2 pt-1">
            {content.buttons.map((b) => (
              <span
                key={b.id}
                className="w-full rounded-[10px] px-4 py-2.5 text-center text-[13.5px] font-semibold"
                style={b.style === "primary" ? { background: accent, color: "#fff" } : { background: "#fff", color: accent, border: `1px solid ${accent}` }}
              >
                {b.text || "Button"}
              </span>
            ))}
          </div>
        </div>
      </div>
      <span className="flex size-14 items-center justify-center rounded-full text-white shadow-lg" style={{ background: accent }} aria-hidden>
        <TbMessageCircle size={26} />
      </span>
    </div>
  );
}
