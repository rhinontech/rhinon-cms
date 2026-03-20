"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type EmailHtmlPreviewProps = {
  html: string;
  title: string;
};

function sanitizeEmailHtml(html: string): string {
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}

export function EmailHtmlPreview({ html, title }: EmailHtmlPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState(720);

  const srcDoc = useMemo(() => sanitizeEmailHtml(html), [html]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let observer: ResizeObserver | null = null;
    const timers: number[] = [];

    const updateHeight = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      const nextHeight = Math.max(
        doc.body?.scrollHeight || 0,
        doc.documentElement?.scrollHeight || 0,
        720
      );

      setFrameHeight(nextHeight);
    };

    const attachObserver = () => {
      updateHeight();

      const doc = iframe.contentDocument;
      if (!doc) return;

      if (typeof ResizeObserver !== "undefined" && doc.body) {
        observer = new ResizeObserver(updateHeight);
        observer.observe(doc.body);
        observer.observe(doc.documentElement);
      }

      [80, 240, 600].forEach((delay) => {
        timers.push(window.setTimeout(updateHeight, delay));
      });
    };

    iframe.addEventListener("load", attachObserver);
    attachObserver();

    return () => {
      iframe.removeEventListener("load", attachObserver);
      observer?.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [srcDoc]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-black/20 shadow-inner">
      <iframe
        ref={iframeRef}
        srcDoc={srcDoc}
        title={title}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        className="w-full border-0 bg-white"
        style={{ height: `${frameHeight}px` }}
      />
    </div>
  );
}
