"use client";

import React from "react";

interface AiTool {
  id: string;
  name: string;
  iconBg: string;
  iconContent: React.ReactNode;
}

export function EventAiToolKit() {
  const tools: AiTool[] = [
    // Row 1
    {
      id: "openai",
      name: "OpenAI",
      iconBg: "bg-black text-white",
      iconContent: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M22.28 10.1a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A6.06 6.06 0 0 0 4.9 3.8a6.05 6.05 0 0 0-3.23 6.36 6 6 0 0 0 .52 4.91 6.05 6.05 0 0 0 6.51 2.9 6.06 6.06 0 0 0 10.35-1.51 6.05 6.05 0 0 0 3.23-6.36zm-9.36 10.96a4.42 4.42 0 0 1-2.9-1.08l.15-.08 4.8-2.77a.82.82 0 0 0 .42-.71v-6.79l2.04 1.18a.07.07 0 0 1 .04.05v5.77a4.44 4.44 0 0 1-4.55 4.43zM3.6 15.69a4.41 4.41 0 0 1-.55-3.05l.15.09 4.8 2.77a.82.82 0 0 0 .82 0l5.88-3.4v2.36a.07.07 0 0 1-.03.06l-5 2.89a4.44 4.44 0 0 1-6.07-1.72zm-1.07-8.9a4.42 4.42 0 0 1 2.36-1.96v.18l-.01 5.54a.82.82 0 0 0 .4.71l5.89 3.4-2.04 1.18a.07.07 0 0 1-.07 0l-5-2.88a4.44 4.44 0 0 1-1.53-6.17zm15.42 2.89l-5.88-3.4 2.04-1.18a.07.07 0 0 1 .07 0l5 2.88a4.44 4.44 0 0 1 1.53 6.17 4.42 4.42 0 0 1-2.36 1.96v-.18l.01-5.54a.82.82 0 0 0-.41-.71zm3.45 6.13l-.15-.09-4.8-2.77a.82.82 0 0 0-.82 0l-5.88 3.4v-2.36a.07.07 0 0 1 .03-.06l5-2.89a4.44 4.44 0 0 1 6.62 4.77zm-9.74-2.87l-2.7-1.56 2.7-1.56 2.7 1.56z" />
        </svg>
      ),
    },
    {
      id: "claude",
      name: "Claude",
      iconBg: "bg-[#fbf0ea] text-[#d97757] border border-[#f5d0c0]",
      iconContent: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2a1.5 1.5 0 0 1 1.5 1.5v3.6a1.5 1.5 0 0 1-3 0V3.5A1.5 1.5 0 0 1 12 2zm0 13.4a1.5 1.5 0 0 1 1.5 1.5v3.6a1.5 1.5 0 0 1-3 0v-3.6a1.5 1.5 0 0 1 1.5-1.5zM2 12a1.5 1.5 0 0 1 1.5-1.5h3.6a1.5 1.5 0 0 1 0 3H3.5A1.5 1.5 0 0 1 2 12zm13.4 0a1.5 1.5 0 0 1 1.5-1.5h3.6a1.5 1.5 0 0 1 0 3h-3.6a1.5 1.5 0 0 1-1.5-1.5zM4.93 4.93a1.5 1.5 0 0 1 2.12 0l2.55 2.55a1.5 1.5 0 1 1-2.12 2.12L4.93 7.05a1.5 1.5 0 0 1 0-2.12zm9.47 9.47a1.5 1.5 0 0 1 2.12 0l2.55 2.55a1.5 1.5 0 1 1-2.12 2.12l-2.55-2.55a1.5 1.5 0 0 1 0-2.12zM19.07 4.93a1.5 1.5 0 0 1 0 2.12l-2.55 2.55a1.5 1.5 0 1 1-2.12-2.12l2.55-2.55a1.5 1.5 0 0 1 2.12 0zM9.6 14.4a1.5 1.5 0 0 1 0 2.12L7.05 19.07a1.5 1.5 0 1 1-2.12-2.12l2.55-2.55a1.5 1.5 0 0 1 2.12 0z" />
        </svg>
      ),
    },
    {
      id: "mem0",
      name: "Mem0",
      iconBg: "bg-[#ddd6fe] text-[#6d28d9]",
      iconContent: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <circle cx="6" cy="12" r="1.5" />
          <circle cx="18" cy="12" r="1.5" />
          <circle cx="12" cy="6" r="1.5" />
          <circle cx="12" cy="18" r="1.5" />
          <circle cx="7.75" cy="7.75" r="1.5" />
          <circle cx="16.25" cy="16.25" r="1.5" />
          <circle cx="16.25" cy="7.75" r="1.5" />
          <circle cx="7.75" cy="16.25" r="1.5" />
        </svg>
      ),
    },
    {
      id: "n8n",
      name: "n8n",
      iconBg: "bg-[#ea4b71] text-white",
      iconContent: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M5 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 2a5 5 0 0 0 4.54-2.91L13 13.5v2.5a3 3 0 1 0 2 0v-2.5l3.46-2.41A5 5 0 0 0 23 14a5 5 0 0 0-4.54-2.91L15 8.68V6.18a3 3 0 1 0-2 0v2.5L9.54 11.09A5 5 0 0 0 5 14z" />
        </svg>
      ),
    },
    {
      id: "amplitude",
      name: "Amplitude AI",
      iconBg: "bg-[#1860f0] text-white",
      iconContent: (
        <span className="font-sans font-medium text-lg leading-none italic">
          A
        </span>
      ),
    },

    // Row 2
    {
      id: "lovable",
      name: "Lovable",
      iconBg: "bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 text-white",
      iconContent: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ),
    },
    {
      id: "opal",
      name: "Opal",
      iconBg: "bg-slate-900 text-white",
      iconContent: (
        <div className="relative w-4 h-4 flex items-center justify-center">
          <span className="absolute w-2 h-2 rounded-full border-2 border-emerald-400" />
          <span className="absolute -top-0.5 w-1 h-1 rounded-full bg-cyan-400" />
          <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-rose-400" />
          <span className="absolute -left-0.5 w-1 h-1 rounded-full bg-amber-400" />
          <span className="absolute -right-0.5 w-1 h-1 rounded-full bg-purple-400" />
        </div>
      ),
    },
    {
      id: "stable-diffusion",
      name: "Stable Diffusion",
      iconBg: "bg-slate-900 text-white",
      iconContent: (
        <svg className="w-5 h-5 fill-current text-cyan-400" viewBox="0 0 24 24">
          <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9A8.94 8.94 0 0 0 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-3.5 8c-.83 0-1.5-.67-1.5-1.5S7.67 8 8.5 8s1.5.67 1.5 1.5S9.33 11 8.5 11zm3.5-3c-.83 0-1.5-.67-1.5-1.5S11.17 5 12 5s1.5.67 1.5 1.5S12.83 8 12 8zm3.5 3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
        </svg>
      ),
    },
    {
      id: "bolt",
      name: "Bolt.new",
      iconBg: "bg-black text-white",
      iconContent: (
        <span className="font-serif italic font-medium text-lg leading-none">
          b
        </span>
      ),
    },
    {
      id: "notion",
      name: "Notion AI",
      iconBg: "bg-white text-gray-900 border border-gray-200",
      iconContent: (
        <div className="border-2 border-gray-900 rounded px-1 text-[11px] font-medium leading-none">
          N
        </div>
      ),
    },

    // Row 3
    {
      id: "mixpanel",
      name: "Mixpanel",
      iconBg: "bg-indigo-50 border border-indigo-200 text-indigo-700",
      iconContent: (
        <div className="flex items-center gap-0.5">
          <span className="w-1.5 h-4 bg-indigo-600 rounded-xs" />
          <span className="w-1.5 h-3 bg-purple-500 rounded-xs" />
          <span className="w-1.5 h-5 bg-indigo-600 rounded-xs" />
        </div>
      ),
    },
    {
      id: "cursor",
      name: "Cursor",
      iconBg: "bg-slate-900 text-white",
      iconContent: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" fillOpacity="0.4" />
          <polyline points="2 8.5 12 14.5 22 8.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <line x1="12" y1="14.5" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      id: "vercel",
      name: "Vercel",
      iconBg: "bg-black text-white",
      iconContent: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 1L24 22H0L12 1z" />
        </svg>
      ),
    },
    {
      id: "colab",
      name: "Google Colab",
      iconBg: "bg-slate-900 text-white",
      iconContent: (
        <div className="flex items-center text-amber-500 text-sm font-medium tracking-tighter">
          <span>c</span>
          <span>o</span>
        </div>
      ),
    },
  ];

  return (
    <section className="w-full bg-white py-12 sm:py-16 px-4 sm:px-6 flex justify-center border-b border-gray-100 select-none">
      <div className="w-full max-w-6xl flex flex-col items-center">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 font-poppins">
          <span className="block text-xs sm:text-sm font-medium tracking-widest uppercase text-indigo-600 mb-2">
            AI TOOL KIT
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-gray-900 tracking-tight leading-tight">
            Tools you will learn
          </h2>
        </div>

        {/* Tools Badges Container */}
        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 max-w-5xl mx-auto">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="group bg-white hover:bg-gray-50/80 border border-gray-200/90 hover:border-indigo-300 rounded-2xl px-4 sm:px-5 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 flex items-center gap-3 cursor-pointer shrink-0"
            >
              {/* Tool Icon Box */}
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform ${tool.iconBg}`}
              >
                {tool.iconContent}
              </div>

              {/* Tool Name */}
              <span className="text-xs sm:text-sm font-medium text-gray-800 group-hover:text-indigo-600 transition-colors font-poppins whitespace-nowrap">
                {tool.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default EventAiToolKit;
