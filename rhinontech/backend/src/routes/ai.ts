import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { env } from "../config/env";

const router = Router();
router.use(authenticate);

/**
 * Image model. The Imagen `:predict` endpoint this route originally used is not
 * available on our API key (ListModels returns no imagen-* model at all), so images
 * come from the Gemini image models via the ordinary `generateContent` call, which
 * returns the picture as an inlineData part. Override with GEMINI_IMAGE_MODEL if
 * Google renames the model again.
 */
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";

// POST /ai/images/generate — returns a data: URI for the generated image
router.post("/images/generate", async (req: AuthRequest, res: Response) => {
  const { prompt } = req.body;
  if (!prompt?.trim()) {
    res.status(400).json({ message: "prompt is required" });
    return;
  }

  const apiKey = env.geminiApiKey;
  if (!apiKey) {
    res.status(500).json({ message: "GEMINI_API_KEY not configured" });
    return;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt.trim() }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      }
    );

    const data = (await response.json()) as any;

    if (!response.ok) {
      console.error(`[AI] Image API error (${IMAGE_MODEL}):`, JSON.stringify(data?.error || data).slice(0, 500));
      const message: string = data?.error?.message || "Failed to generate image";
      res.status(response.status).json({
        message: /not found|not supported/i.test(message)
          ? `Image model "${IMAGE_MODEL}" is unavailable on this API key. Set GEMINI_IMAGE_MODEL to a model your key supports.`
          : message,
      });
      return;
    }

    const parts: any[] = data?.candidates?.[0]?.content?.parts || [];
    const image = parts.find((p) => p?.inlineData?.data);

    if (!image) {
      // A safety block or a text-only reply lands here — surface why rather than a bare 500.
      const finishReason = data?.candidates?.[0]?.finishReason;
      const textPart = parts.find((p) => typeof p?.text === "string")?.text;
      console.error(`[AI] No image part returned (${IMAGE_MODEL}). finishReason=${finishReason}`);
      res.status(502).json({
        message: textPart
          ? `The model replied with text instead of an image: ${String(textPart).slice(0, 200)}`
          : `No image returned (${finishReason || "unknown reason"}). Try rephrasing the prompt.`,
      });
      return;
    }

    const mimeType: string = image.inlineData.mimeType || "image/jpeg";
    res.json({ url: `data:${mimeType};base64,${image.inlineData.data}` });
  } catch (error: any) {
    console.error("AI Image Generation Error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
