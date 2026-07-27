"use client";

import { TbLoader, TbPhoto, TbWand, TbX } from "react-icons/tb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function TemplateImageField({
  currentUrl,
  prompt,
  onPromptChange,
  onGenerate,
  onClear,
  generating,
  error,
  manualUrl,
  onManualUrl,
}: {
  currentUrl: string;
  prompt: string;
  onPromptChange: (v: string) => void;
  onGenerate: () => void;
  onClear: () => void;
  generating: boolean;
  error: string;
  manualUrl?: boolean;
  onManualUrl?: (v: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/50 p-3">
      <Label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-stone-500">
        <TbPhoto size={12} /> Image <span className="font-normal normal-case tracking-normal text-stone-300">optional</span>
      </Label>

      {currentUrl ? (
        <div className="group relative overflow-hidden rounded-lg border border-stone-200">
          <img src={currentUrl} alt="Preview" className="max-h-44 w-full object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-red-600"
          >
            <TbX size={14} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="Describe an image to generate with AI..."
              className="text-xs"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onGenerate())}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onGenerate}
              disabled={generating || !prompt.trim()}
              className="shrink-0"
            >
              {generating ? <TbLoader className="animate-spin" size={13} /> : <TbWand size={13} />}
              Generate
            </Button>
          </div>
          {error && <p className="text-[10px] font-medium text-red-500">{error}</p>}
          {manualUrl && onManualUrl && (
            <Input
              type="url"
              placeholder="Or paste an image URL..."
              className="text-xs"
              onBlur={(e) => e.target.value && onManualUrl(e.target.value)}
            />
          )}
        </div>
      )}
    </div>
  );
}
