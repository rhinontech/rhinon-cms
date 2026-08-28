"use client";

import { useRef, useState } from "react";
import { TbUpload, TbX, TbLoader } from "react-icons/tb";
import { apiUpload } from "@/lib/api";

export function ContentImageInput({
  label,
  value,
  onChange,
  placeholder = "or paste an image URL...",
}: {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { url } = await apiUpload<{ url: string }>("/content/upload-image", file);
      onChange(url);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-foreground/85">{label}</label>}

      {value && (
        <div className="relative">
          <img src={value} alt="" className="w-full max-h-44 object-cover rounded-lg border border-border" />
          <button
            type="button"
            onClick={() => onChange("")}
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
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 shrink-0"
        >
          {uploading ? <TbLoader className="animate-spin" size={15} /> : <TbUpload size={15} />}
          {uploading ? "Uploading..." : "Upload"}
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-lg border border-border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
