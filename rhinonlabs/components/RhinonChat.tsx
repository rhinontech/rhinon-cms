"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function RhinonChatLoader() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Only load the chatbot library if loaded state becomes true
    if (!loaded) return;

    import("@rhinon/chat")
      .then(({ default: RhinonChat }) => {
        RhinonChat({ app_id: "3TGBGW", api_url: "https://api.rhinontech.in/widget" });

        // Once actual chatbot renders, simulate click on its launcher to open window
        setTimeout(() => {
          const chatBotEl = document.querySelector("chat-bot");
          if (chatBotEl && chatBotEl.shadowRoot) {
            const actualBtn = chatBotEl.shadowRoot.querySelector(".chat-button") as HTMLButtonElement | null;
            if (actualBtn) actualBtn.click();
          }
        }, 150);
      })
      .catch((err) => {
        console.error("Failed to load chat:", err);
      });
  }, [loaded]);

  const handleLauncherClick = () => {
    if (!loaded) {
      setLoaded(true);
    }
  };

  // Once loaded, the actual web component handles the launcher UI
  if (loaded) {
    return null;
  }

  return (
    <div
      className="fixed bottom-5 right-5 z-40 select-none"
      style={{
        width: 50,
        height: 50,
      }}
    >
      <button
        type="button"
        onClick={handleLauncherClick}
        aria-label="Open chat"
        className="w-[50px] h-[50px] bg-[#1403ac] text-white flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 shadow-lg border-0"
        style={{
          borderRadius: "10% 35% 25% 35%",
        }}
      >
        <Image
          src="https://api.rhinontech.in/widget/assets/bot.png"
          alt="Chat"
          width={32}
          height={32}
          unoptimized
          className="w-8 h-8 object-contain pointer-events-none"
        />
      </button>
    </div>
  );
}
