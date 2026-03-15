import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not found" }, { status: 500 });
    }

    // Call Google's Gemini AI Studio Imagen 4 endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1 },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Imagen API Error:", data);
      return NextResponse.json(
        { error: data.error?.message || "Failed to generate AI image." },
        { status: response.status }
      );
    }

    // Imagen returns base64 image strings in the predictions array
    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
    if (!base64Image) {
      return NextResponse.json({ error: "No image generated." }, { status: 500 });
    }

    // Convert to a data URI so the frontend can display it easily
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error("AI Image Generation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
