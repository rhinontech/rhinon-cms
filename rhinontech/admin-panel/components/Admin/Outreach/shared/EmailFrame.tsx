"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { buildEmailDocument, fontFacesFor, type EmailPalette } from "@/lib/emailFrame";

/** Wide newsletters shrink to fit the column, but never past legibility. */
const MIN_SCALE = 0.55;

/**
 * One email, rendered in a sandboxed iframe sized to its content.
 *
 * Mail used to go into the page through dangerouslySetInnerHTML, so a sender's
 * stylesheet restyled the whole admin (Common App's `p{margin:13px 0}` stretched
 * every row of the inbox list) and their markup ran in our origin. The sandbox
 * has no allow-scripts, so nothing in a message can run, and its CSS stops at
 * the frame. allow-same-origin only lets this component measure the content to
 * size the frame; without scripts it gives the message nothing.
 */
export function EmailFrame({ html, className, title = "Email message" }: { html: string; className?: string; title?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const watched = useRef(new WeakSet<Document>());
  const lastWidth = useRef(0);
  const { resolvedTheme } = useTheme();
  const [palette, setPalette] = useState<EmailPalette | null>(null);

  // Plain messages take the colours and type around them, so they read as part
  // of the thread in either theme. Re-read when the theme flips.
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const style = getComputedStyle(host);
    setPalette({
      text: style.color,
      muted: `color-mix(in oklch, ${style.color} 62%, transparent)`,
      link: style.getPropertyValue("--email-link").trim() || style.getPropertyValue("--editor-link").trim() || "#2563eb",
      fontFamily: style.fontFamily,
      fontFaces: fontFacesFor(style.fontFamily),
      dark: document.documentElement.classList.contains("dark"),
    });
  }, [resolvedTheme]);

  const doc = useMemo(() => (palette ? buildEmailDocument(html, palette) : null), [html, palette]);

  const fit = useCallback(() => {
    const frame = frameRef.current;
    const content = frame?.contentDocument;
    const root = content?.documentElement;
    if (!frame || !content || !root || content.URL !== "about:srcdoc") return;

    if (!watched.current.has(content)) {
      watched.current.add(content);
      // Each image changes the height as it lands; load does not bubble, so capture it.
      content.addEventListener("load", fit, true);
      content.fonts?.ready.then(fit).catch(() => {});
    }

    root.style.zoom = "";
    // Collapse first so layouts that set height:100% report their content, not the frame.
    frame.style.height = "0px";
    const available = frame.clientWidth;
    const natural = root.scrollWidth;
    if (available > 0 && natural > available + 1) root.style.zoom = String(Math.max(available / natural, MIN_SCALE));
    // Both read in zoomed pixels. The box is 0 when the sender set html/body to
    // height:100%, and scrollHeight still has the content then.
    frame.style.height = `${Math.ceil(Math.max(root.getBoundingClientRect().height, root.scrollHeight))}px`;
    lastWidth.current = available;
  }, []);

  // Measure as soon as the new document has parsed rather than waiting for
  // every image, and again whenever the column changes width.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !doc) return;
    const previous = frame.contentDocument;
    let raf = 0;
    const waitForDocument = () => {
      const current = frame.contentDocument;
      if (current && current !== previous && current.URL === "about:srcdoc" && current.readyState !== "loading") fit();
      else raf = requestAnimationFrame(waitForDocument);
    };
    raf = requestAnimationFrame(waitForDocument);
    const resize = new ResizeObserver(() => {
      if (frame.clientWidth !== lastWidth.current) fit();
    });
    resize.observe(frame);
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
    };
  }, [doc, fit]);

  return (
    <div
      ref={hostRef}
      className={cn(doc?.designed && "overflow-hidden rounded-lg bg-white ring-1 ring-black/[0.06] dark:ring-white/10", className)}
    >
      {doc && (
        <iframe
          ref={frameRef}
          title={title}
          srcDoc={doc.srcDoc}
          sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          onLoad={fit}
          className="block w-full border-0 bg-transparent"
          style={{ colorScheme: doc.designed || !palette?.dark ? "light" : "dark" }}
        />
      )}
    </div>
  );
}
