"use client";

import { useRef, useState } from "react";
import { TbPhotoPlus, TbX, TbLoader } from "react-icons/tb";
import { apiUpload } from "@/lib/api";

/**
 * Notion-style page cover. Rendered OUTSIDE the content column so the image
 * bleeds edge-to-edge across the editor panel; the empty state keeps its
 * "Add cover" button aligned with the content column below it.
 */
export function CoverImage({
  coverImage,
  onChange,
  disabled,
}: {
  coverImage: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await apiUpload<{ url: string }>("/content/upload-image", file);
      onChange(url);
    } catch (err: any) {
      alert(err.message || "Cover upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (!coverImage) {
    if (disabled) return null;
    return (
      <div className="group flex h-12 items-end">
        <div className="mx-auto w-full max-w-3xl px-10">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-400 opacity-0 transition-opacity hover:bg-stone-100 hover:text-stone-700 group-hover:opacity-100"
          >
            {uploading ? <TbLoader size={14} className="animate-spin" /> : <TbPhotoPlus size={14} />}
            {uploading ? "Uploading…" : "Add cover"}
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
    );
  }

  return (
    <div className="group relative h-64 w-full overflow-hidden">
      <img src={coverImage} alt="" className="h-full w-full object-cover" />
      {!disabled && (
        <div className="absolute bottom-4 right-6 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg bg-black/50 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/70"
          >
            {uploading ? "Uploading…" : "Change cover"}
          </button>
          <button
            onClick={() => onChange(null)}
            className="flex items-center gap-1 rounded-lg bg-black/50 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/70"
          >
            <TbX size={13} /> Remove
          </button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}
