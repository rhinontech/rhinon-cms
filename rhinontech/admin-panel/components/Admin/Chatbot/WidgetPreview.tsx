"use client";

import { useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/api";
import type { ChatbotConfig, ChatbotForms } from "./chatbotApi";

/**
 * The real widget, in its admin-preview mode, inside a framed box.
 *
 * The same rhinon-chat.js customers embed is loaded from our backend, so the
 * preview cannot drift from what visitors see. The widget positions itself
 * `fixed`; the `transform` on the frame makes that frame its containing block,
 * so it stays in the box instead of floating over the admin.
 */

type RhinonBotFn = (config: Record<string, unknown>) => HTMLElement & { setConfig: (c: Record<string, unknown>) => void; remove: () => void };

let loading: Promise<RhinonBotFn> | null = null;

function loadWidget(): Promise<RhinonBotFn> {
  const existing = (window as unknown as { RhinonChat?: RhinonBotFn }).RhinonChat;
  if (existing) return Promise.resolve(existing);
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    // Customers' sites cache the widget for 10 minutes; the preview must always
    // show the latest release, so it asks for a fresh copy once per page load.
    script.src = `${API_URL}/widget/rhinon-chat.js?v=${Date.now()}`;
    script.async = true;
    script.onload = () => {
      const fn = (window as unknown as { RhinonChat?: RhinonBotFn }).RhinonChat;
      if (fn) resolve(fn);
      else reject(new Error("Widget did not load"));
    };
    script.onerror = () => {
      loading = null;
      reject(new Error("Widget did not load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export function WidgetPreview({
  appId,
  config,
  forms,
  page = "Home",
  testing = false,
}: {
  appId: string;
  config: ChatbotConfig;
  forms?: ChatbotForms;
  page?: "Home" | "Chats" | "Help";
  /** Real answers from the trained bot; chats are tagged as tests server-side. */
  testing?: boolean;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const instance = useRef<ReturnType<RhinonBotFn> | null>(null);
  const [failed, setFailed] = useState(false);

  const widgetConfig = {
    app_id: appId,
    admin: true,
    adminTestingMode: testing,
    chatbot_config: {
      ...config,
      selectedPage: page,
      preChatForm: forms?.pre_chat_form,
      postChatForm: forms?.post_chat_form,
      ticketForm: forms?.ticket_form,
    },
  };
  const serialized = JSON.stringify(widgetConfig);

  useEffect(() => {
    let alive = true;
    loadWidget()
      .then((RhinonBot) => {
        if (!alive || !frame.current) return;
        if (instance.current) {
          instance.current.setConfig(JSON.parse(serialized));
        } else {
          instance.current = RhinonBot({ ...JSON.parse(serialized), container: frame.current });
        }
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [serialized]);

  useEffect(
    () => () => {
      instance.current?.remove();
      instance.current = null;
    },
    []
  );

  return (
    <div className="relative mx-auto h-[min(760px,calc(100vh_-_215px))] w-full max-w-[440px] overflow-hidden rounded-2xl border border-border bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(127,127,127,0.04)_10px,rgba(127,127,127,0.04)_20px)]">
      <div ref={frame} className="absolute inset-0" style={{ transform: "translateZ(0)" }} data-testid="widget-preview" />
      {failed && (
        <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
          The preview couldn&apos;t load the widget from the API. Check that the backend is running.
        </p>
      )}
    </div>
  );
}
