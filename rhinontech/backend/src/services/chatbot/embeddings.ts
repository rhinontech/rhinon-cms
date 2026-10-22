import axios from "axios";
import { env } from "../../config/env";
import { EMBEDDING_DIMENSIONS } from "./vectorStore";

/**
 * Gemini embeddings over REST. The SDK version we pin cannot set
 * outputDimensionality, and 768 dimensions keeps the HNSW index small on a
 * t2.micro. Documents and questions are embedded with different task types,
 * which is what Gemini recommends for retrieval.
 */
const MODEL = "gemini-embedding-001";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:batchEmbedContents`;
const BATCH = 100; // the API's per-request maximum

type TaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

async function embedBatch(texts: string[], taskType: TaskType): Promise<number[][]> {
  const body = {
    requests: texts.map((text) => ({
      model: `models/${MODEL}`,
      content: { parts: [{ text }] },
      taskType,
      outputDimensionality: EMBEDDING_DIMENSIONS,
    })),
  };
  for (let attempt = 0; ; attempt++) {
    try {
      const { data } = await axios.post(URL, body, {
        headers: { "x-goog-api-key": env.geminiApiKey },
        timeout: 60_000,
      });
      return (data.embeddings as { values: number[] }[]).map((e) => e.values);
    } catch (err: any) {
      const status = err.response?.status;
      // 429 / 5xx are worth one or two more tries; anything else is a real error.
      if (attempt < 2 && (status === 429 || status >= 500)) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      throw new Error(err.response?.data?.error?.message || err.message);
    }
  }
}

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    out.push(...(await embedBatch(texts.slice(i, i + BATCH), "RETRIEVAL_DOCUMENT")));
  }
  return out;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [vector] = await embedBatch([text], "RETRIEVAL_QUERY");
  return vector;
}
