import { env } from "../config/env";
import { uploadBuffer, publicUrl } from "./storage";

/** Same model and override as routes/ai.ts, so both follow GEMINI_IMAGE_MODEL. */
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";

/**
 * House style appended to every blog image prompt. Hard rule from the owner:
 * images must look creative and realistic — like a UX designer made them by
 * hand — never generic "futuristic AI" art. Text inside generated images is
 * usually garbled, so it stays banned.
 */
const STYLE =
  "Style: an editorial illustration that looks hand-crafted by a senior UX designer — " +
  "deliberate composition, visible craft (subtle grain, hand-drawn line quality, imperfect organic shapes), " +
  "grounded in a realistic everyday work scene or real objects (desks, notebooks, phones, whiteboards, rupee notes, coffee cups) " +
  "rather than abstract tech metaphors. Warm, natural, muted palette with one confident accent colour; soft realistic light; " +
  "generous negative space; 16:9 landscape. " +
  "HARD RULES: absolutely no futuristic or sci-fi styling — no neon glows, no circuit boards, no glowing brains, no holograms, " +
  "no blue-purple gradient tech aesthetic, no robots unless the article is literally about robots. " +
  "No text, no letters, no logos, no watermarks, no realistic identifiable human faces.";

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
