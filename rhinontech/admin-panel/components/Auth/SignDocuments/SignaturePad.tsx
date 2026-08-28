"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Dancing_Script } from "next/font/google";
import { TbTypography, TbPencil, TbEraser } from "react-icons/tb";
import { cn } from "@/lib/utils";

const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["600"] });

type Mode = "typed" | "drawn";

export function SignaturePad({
  defaultName,
  busy,
  onSubmit,
}: {
  defaultName: string;
  busy: boolean;
  onSubmit: (payload: { type: "typed"; fullName: string } | { type: "drawn"; signatureImageBase64: string }) => void;
}) {
  const [mode, setMode] = useState<Mode>("typed");
  const [fullName, setFullName] = useState(defaultName);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<SignatureCanvas>(null);

  const canSubmit = mode === "typed" ? fullName.trim().length > 0 : hasDrawn;

  const handleSubmit = () => {
    if (mode === "typed") {
      const trimmed = fullName.trim();
      if (!trimmed) return;
      onSubmit({ type: "typed", fullName: trimmed });
    } else {
      if (!hasDrawn || !canvasRef.current) return;
      const dataUrl = canvasRef.current.getTrimmedCanvas().toDataURL("image/png");
      onSubmit({ type: "drawn", signatureImageBase64: dataUrl });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-1 rounded-lg bg-muted p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode("typed")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            mode === "typed" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground/85"
          )}
        >
          <TbTypography size={14} /> Type your name
        </button>
        <button
          type="button"
          onClick={() => setMode("drawn")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            mode === "drawn" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground/85"
          )}
        >
          <TbPencil size={14} /> Draw signature
        </button>
      </div>

      {mode === "typed" ? (
        <div className="space-y-2">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full legal name"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={120}
          />
          <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-4">
            <span className={cn(dancingScript.className, "text-3xl text-foreground")}>
              {fullName.trim() || "Your signature preview"}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative h-40 rounded-lg border border-dashed border-border bg-muted/40">
            <SignatureCanvas
              ref={canvasRef}
              penColor="#1c1c1c"
              onEnd={() => setHasDrawn(true)}
              canvasProps={{ className: "w-full h-full rounded-lg" }}
            />
            {!hasDrawn && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                Draw your signature here
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => { canvasRef.current?.clear(); setHasDrawn(false); }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground/85"
          >
            <TbEraser size={14} /> Clear
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit || busy}
        className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {busy ? "Submitting..." : "Sign & Continue"}
      </button>
    </div>
  );
}
