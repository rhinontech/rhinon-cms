import type { BlogBlock } from "@/lib/api";
import { extractYouTubeId, stripScripts, withHeadingIds } from "./blocks";

function Caption({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <figcaption className="mt-3 text-center text-xs font-medium tracking-wide text-muted-foreground">
      {text}
    </figcaption>
  );
}

export function BlockRenderer({ blocks }: { blocks: BlogBlock[] }) {
  // One shared map keeps heading ids aligned with extractToc across all blocks.
  const seenHeadings = new Map<string, number>();

  return (
    <div className="space-y-10">
      {blocks.map((block) => {
        switch (block.type) {
          case "paragraph":
            return (
              <div
                key={block.id}
                className="article-html"
                dangerouslySetInnerHTML={{ __html: withHeadingIds(stripScripts(block.html), seenHeadings) }}
              />
            );
          case "image":
            if (!block.url) return null;
            return (
              <figure key={block.id}>
                <div className="overflow-hidden rounded-[32px] border border-white/5 shadow-2xl">
                  <img src={block.url} alt={block.alt || ""} className="w-full object-cover" loading="lazy" />
                </div>
                <Caption text={block.credit} />
              </figure>
            );
          case "video":
            if (!block.url) return null;
            return (
              <figure key={block.id}>
                <div className="overflow-hidden rounded-[32px] border border-white/5 bg-black shadow-2xl">
                  <video src={block.url} controls playsInline preload="metadata" className="w-full" />
                </div>
                <Caption text={block.caption} />
              </figure>
            );
          case "youtube": {
            const videoId = extractYouTubeId(block.url);
            if (!videoId) return null;
            return (
              <figure key={block.id}>
                <div className="aspect-video overflow-hidden rounded-[32px] border border-white/5 bg-black shadow-2xl">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                    title="YouTube video"
                    className="h-full w-full"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <Caption text={block.caption} />
              </figure>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
