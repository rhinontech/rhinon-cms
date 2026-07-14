"use client";

import { useRef, useState } from "react";
import { TbUpload, TbX, TbLoader } from "react-icons/tb";
import { apiUpload } from "@/lib/api";

const MAX_VIDEO_MB = 100;

export function VideoBlock({
  url,
  caption,
  onChange,
}: {
  url: string;
  caption?: string;
  onChange: (patch: { url?: string; caption?: string }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`Video exceeds the ${MAX_VIDEO_MB} MB limit`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setUploading(true);
    setError("");
    try {
      const { url: uploaded } = await apiUpload<{ url: string }>("/content/upload-video", file, "video");
      onChange({ url: uploaded });
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3 p-4">
      {url && (
        <div className="relative">
          <video src={url} controls preload="metadata" className="w-full max-h-72 rounded-lg border border-stone-100 bg-black" />
          <button
            type="button"
            onClick={() => onChange({ url: "" })}
            className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-red-600 transition-colors"
            title="Remove"
          >
            <TbX size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-100 disabled:opacity-50 shrink-0"
        >
          {uploading ? <TbLoader className="animate-spin" size={15} /> : <TbUpload size={15} />}
          {uploading ? "Uploading…" : url ? "Replace Video" : "Upload Video"}
        </button>
        <input
          type="text"
          value={url}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="or paste a video URL…"
          className="flex-1 px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
        />
      </div>
      <p className="text-xs text-stone-400">MP4, WebM or MOV — up to {MAX_VIDEO_MB} MB.</p>
      {error && <p className="text-xs text-red-500">{error}</p>}

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

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
