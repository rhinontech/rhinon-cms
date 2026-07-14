"use client";

import { ContentImageInput } from "../ContentImageInput";

export function ImageBlock({
  url,
  alt,
  credit,
  onChange,
}: {
  url: string;
  alt?: string;
  credit?: string;
  onChange: (patch: { url?: string; alt?: string; credit?: string }) => void;
}) {
  return (
    <div className="space-y-3 p-4">
      <ContentImageInput label="Image" value={url} onChange={(v) => onChange({ url: v })} />
      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Alt Text
        <input
          type="text"
          value={alt || ""}
          onChange={(e) => onChange({ alt: e.target.value })}
          placeholder="Describe the image for accessibility & SEO"
          className="w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900 bg-white text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Credit (Optional)
        <input
          type="text"
          value={credit || ""}
          onChange={(e) => onChange({ credit: e.target.value })}
          placeholder="Enter image credit"
          className="w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900 bg-white text-sm"
        />
      </label>
    </div>
  );
}
