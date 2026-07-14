"use client";

import { extractYouTubeId } from "./types";

export function YouTubeBlock({
  url,
  caption,
  onChange,
}: {
  url: string;
  caption?: string;
  onChange: (patch: { url?: string; caption?: string }) => void;
}) {
  const videoId = extractYouTubeId(url);

  return (
    <div className="space-y-3 p-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        YouTube URL
        <input
          type="text"
          value={url}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="https://www.youtube.com/watch?v=…"
          className="w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900 bg-white text-sm"
        />
      </label>

      {url && !videoId && (
        <p className="text-xs text-amber-600">Couldn&apos;t detect a video ID — paste a full YouTube link (watch, youtu.be or shorts).</p>
      )}

      {videoId && (
        <div className="aspect-video overflow-hidden rounded-lg border border-stone-100 bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            title="YouTube preview"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Caption (Optional)
        <input
          type="text"
          value={caption || ""}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Shown under the video"
          className="w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900 bg-white text-sm"
        />
      </label>
    </div>
  );
}
