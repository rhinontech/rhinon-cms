"use client";

import { useMemo, useState } from "react";
import { parseEmailBody } from "@/lib/emailUtils";
import { cn } from "@/lib/utils";
import { TbDots } from "react-icons/tb";

interface EmailBodyViewProps {
  body: string;
  className?: string;
  proseClassName?: string;
}

export function EmailBodyView({
  body,
  className,
  proseClassName = "prose prose-sm max-w-none break-words [&_*]:!my-1",
}: EmailBodyViewProps) {
  const [showQuoted, setShowQuoted] = useState(false);
  const parsed = useMemo(() => parseEmailBody(body), [body]);

  const htmlContent = showQuoted ? parsed.raw : parsed.cleaned;

  return (
    <div className={className}>
      <div
        className={proseClassName}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      {parsed.hasQuoted && (
        <button
          type="button"
          onClick={() => setShowQuoted((prev) => !prev)}
          className={cn(
            "mt-2 inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50/80 px-2 py-1 text-[11px] font-medium text-stone-500 hover:border-stone-300 hover:bg-stone-100 hover:text-stone-800 transition-colors"
          )}
          title={showQuoted ? "Hide quoted text" : "Show quoted text"}
        >
          <TbDots className="h-3.5 w-3.5 text-stone-400" />
          <span>{showQuoted ? "Hide quoted text" : "Show quoted text"}</span>
        </button>
      )}
    </div>
  );
}
