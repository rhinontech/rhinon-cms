"use client";

import { useMemo, useState } from "react";
import { parseEmailBody } from "@/lib/emailUtils";
import { TbDots } from "react-icons/tb";
import { EmailFrame } from "./EmailFrame";

interface EmailBodyViewProps {
  body: string;
  className?: string;
}

/** An email body with its quoted history folded away behind a toggle. */
export function EmailBodyView({ body, className }: EmailBodyViewProps) {
  const [showQuoted, setShowQuoted] = useState(false);
  const parsed = useMemo(() => parseEmailBody(body), [body]);

  return (
    <div className={className}>
      <EmailFrame html={showQuoted ? parsed.raw : parsed.cleaned} />
      {parsed.hasQuoted && (
        <button
          type="button"
          onClick={() => setShowQuoted((prev) => !prev)}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground"
          title={showQuoted ? "Hide quoted text" : "Show quoted text"}
        >
          <TbDots className="h-3.5 w-3.5" />
          <span>{showQuoted ? "Hide quoted text" : "Show quoted text"}</span>
        </button>
      )}
    </div>
  );
}
