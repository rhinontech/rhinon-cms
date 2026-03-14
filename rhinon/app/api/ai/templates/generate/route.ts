import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { prompt, channel } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const { RHINON_KNOWLEDGE } = await import("@/lib/gemini");

    const systemPrompt = `You are an expert copywriter for a high-end outreach platform called Rhinon.

RHINON COMPANY KNOWLEDGE:
${RHINON_KNOWLEDGE}

Your goal is to generate a messaging template for the channel: ${channel}.
The user wants this template to achieve: "${prompt}"

Available variables to use in the template:
- {{lead.name}} (Full name)
- {{lead.company}} (Company name)
- {{lead.title}} (Job title)
- {{sender.name}} (Your name)

Return the result as a JSON object with:
- name: A short internal name for this template
- subject: (Only if channel is Cold Email) A compelling subject line
- body: The message body with variables. If the user provided a structure, use it as a base. 
- aiInstructions: Specific instructions for the AI to further personalize this when sending to a specific lead. Remind the AI to research the company and tailored benefits.

Format the response strictly as a JSON object.`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON from markdown if needed
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanJson);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("AI Template Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
