import React from "react";

const TOOL_ICONS: Record<string, string> = {
  Claude: "/tools/claude.svg",
  OpenAI: "/tools/openai.svg",
  n8n: "/tools/n8n.svg",
  "Make.com": "/tools/make.svg",
  CrewAI: "/tools/crewai.svg",
  LangGraph: "/tools/langgraph.svg",
  MCP: "/tools/mcp.svg",
  ElevenLabs: "/tools/elevenlabs.svg",
  Lovable: "/tools/lovable.svg",
  Python: "/tools/python.svg",
  Supabase: "/tools/supabase.svg",
  Cursor: "/tools/cursor.svg",
  "Claude Code": "/tools/claude-code.svg",
  "Hugging Face": "/tools/huggingface.svg",
};

export function ToolLogo({
  tool,
  className = "w-4 h-4",
}: {
  tool: string;
  className?: string;
}) {
  const iconSrc = TOOL_ICONS[tool];

  if (!iconSrc) {
    return (
      <span className="grid place-items-center w-5 h-5 rounded-md bg-white text-[#0B1B3D] text-[11px] font-bold font-sans">
        {tool.charAt(0)}
      </span>
    );
  }

  return (
    <img
      src={iconSrc}
      alt={`${tool} logo`}
      className={`${className} object-contain shrink-0`}
      loading="lazy"
    />
  );
}

export default ToolLogo;
