"use client";

import { useState } from "react";

/**
 * Optional picture across the top of a board card. Renders nothing when the task has no
 * cover, or when the signed link has expired or the file is gone, so a card never shows a
 * broken-image box.
 */
export function CardCover({ url }: { url?: string | null }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- signed storage URL, not a static asset
    <img
      src={url}
      alt=""
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      className="h-32 w-full select-none object-cover"
    />
  );
}
