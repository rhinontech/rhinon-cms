import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { env } from "../config/env";

const router = Router();
router.use(authenticate);

// POST /ai/images/generate — Imagen 4 via Gemini API
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
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: prompt.trim() }],
          parameters: { sampleCount: 1 },
        }),
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      console.error("Imagen API Error:", data);
      res.status(response.status).json({ message: data.error?.message || "Failed to generate image" });
      return;
    }

    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
    if (!base64Image) {
      res.status(500).json({ message: "No image returned from Imagen API" });
      return;
    }

    res.json({ url: `data:image/jpeg;base64,${base64Image}` });
  } catch (error: any) {
    console.error("AI Image Generation Error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
