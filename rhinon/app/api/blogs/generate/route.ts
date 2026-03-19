import { NextResponse } from "next/server";
import { generateAIBlogPost } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { title, prompt } = await req.json();

    if (!title && !prompt) {
      return NextResponse.json({ error: "Either Title or Prompt is required" }, { status: 400 });
    }

    const aiResponse = await generateAIBlogPost(title, prompt);
    return NextResponse.json(aiResponse);
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate blog content" }, { status: 500 });
  }
}
