import { buildLlmsFullTxt, textResponse } from "@/lib/llms";

// Full text of the site (services, case studies, FAQs, blog posts) for AI assistants
export async function GET() {
  return textResponse(await buildLlmsFullTxt());
}
