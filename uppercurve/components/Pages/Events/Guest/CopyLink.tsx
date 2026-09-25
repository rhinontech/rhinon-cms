"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy } from "lucide-react";

const noop = () => () => {};

/**
 * Shows a link with a copy button. The origin only exists in the browser, so it
 * comes from useSyncExternalStore: the server snapshot is "" and the first
 * client render matches it, then the full URL appears — no hydration mismatch.
 */
export default function CopyLink({ path }: { path: string }) {
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => "");
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-[13px] text-[#334155]">
        {origin}
        {path}
      </code>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(`${window.location.origin}${path}`);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#0B1B3D] hover:border-[#0052FF]"
      >
        {copied ? <Check className="size-4 text-[#16A34A]" /> : <Copy className="size-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
