import { env } from "../config/env";
import { uploadBuffer, publicUrl } from "./storage";

/** Same model and override as routes/ai.ts, so both follow GEMINI_IMAGE_MODEL. */
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";

/**
 * House style appended to every blog image prompt. Editorial illustrations read
 * as deliberate; photoreal "stock people" read as AI filler, and text inside
 * generated images is usually garbled.
 */
const STYLE =
  "Style: clean modern editorial illustration for a tech/startup blog, flat shapes with subtle depth, " +
  "muted palette with one accent colour, generous negative space, 16:9 landscape. " +
  "No text, no letters, no logos, no watermarks, no realistic human faces.";

/**
 * Generates one image with Gemini and stores it under the public `content/`
 * prefix. Returns the permanent public URL.
 */
export async function generateBlogImage(prompt: string): Promise<string> {
  if (!env.geminiApiKey) throw new Error("GEMINI_API_KEY not configured");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${env.geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${prompt.trim()}\n\n${STYLE}` }] }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    }
  );
  const data = (await res.json()) as any;
  if (!res.ok) throw new Error(data?.error?.message || `Image generation failed (${res.status})`);

  const part = (data?.candidates?.[0]?.content?.parts || []).find((p: any) => p?.inlineData?.data);
  if (!part) throw new Error("The image model returned no image (it may have declined the prompt)");

  const mime: string = part.inlineData.mimeType || "image/png";
  const ext = mime.includes("jpeg") ? ".jpg" : mime.includes("webp") ? ".webp" : ".png";
  const key = await uploadBuffer(Buffer.from(part.inlineData.data, "base64"), `ai-image${ext}`, "content", mime);
  return publicUrl(key);
}
