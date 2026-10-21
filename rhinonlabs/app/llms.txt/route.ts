import { buildLlmsTxt, textResponse } from "@/lib/llms";

// https://llmstxt.org — a Markdown index of the site for AI assistants and agents
export async function GET() {
  return textResponse(await buildLlmsTxt());
}
