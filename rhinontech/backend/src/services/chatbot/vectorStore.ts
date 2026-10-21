import { QueryTypes } from "sequelize";
import { sequelize } from "../../config/database";

/**
 * Training chunks and their embeddings, in pgvector.
 *
 * Not a Sequelize model: sync() cannot declare a `vector` column, and nothing
 * here needs model hooks. That also means the tenancy hooks do NOT see these
 * queries, so every function takes the organizationId explicitly and every
 * statement filters on it. Never add a query here without that filter.
 */

export const EMBEDDING_DIMENSIONS = 768;

export async function ensureVectorSchema(): Promise<void> {
  await sequelize.query(`CREATE EXTENSION IF NOT EXISTS vector`);
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS chatbot_chunks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "organizationId" UUID NOT NULL,
      "chatbotId" UUID NOT NULL,
      "sourceId" UUID NOT NULL,
      content TEXT NOT NULL,
      embedding vector(${EMBEDDING_DIMENSIONS}) NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
  await sequelize.query(`CREATE INDEX IF NOT EXISTS chatbot_chunks_bot_idx ON chatbot_chunks ("organizationId", "chatbotId")`);
  await sequelize.query(`CREATE INDEX IF NOT EXISTS chatbot_chunks_source_idx ON chatbot_chunks ("sourceId")`);
  // HNSW needs no training data, unlike ivfflat, so it works from the first row.
  await sequelize.query(
    `CREATE INDEX IF NOT EXISTS chatbot_chunks_embedding_idx ON chatbot_chunks USING hnsw (embedding vector_cosine_ops)`
  );
}

const toVector = (v: number[]) => `[${v.join(",")}]`;

export async function insertChunks(
  organizationId: string,
  chatbotId: string,
  sourceId: string,
  chunks: { content: string; embedding: number[] }[]
): Promise<void> {
  // Batches of 50 keep each statement well under Postgres's parameter limit.
  for (let i = 0; i < chunks.length; i += 50) {
    const batch = chunks.slice(i, i + 50);
    const values = batch.map((_, j) => `(:org, :bot, :src, :c${j}, CAST(:e${j} AS vector))`).join(", ");
    const replacements: Record<string, string> = { org: organizationId, bot: chatbotId, src: sourceId };
    batch.forEach((c, j) => {
      replacements[`c${j}`] = c.content;
      replacements[`e${j}`] = toVector(c.embedding);
    });
    await sequelize.query(
      `INSERT INTO chatbot_chunks ("organizationId", "chatbotId", "sourceId", content, embedding) VALUES ${values}`,
      { replacements }
    );
  }
}

export async function deleteSourceChunks(organizationId: string, sourceId: string): Promise<void> {
  await sequelize.query(`DELETE FROM chatbot_chunks WHERE "organizationId" = :org AND "sourceId" = :src`, {
    replacements: { org: organizationId, src: sourceId },
  });
}

export async function deleteChatbotChunks(organizationId: string, chatbotId: string): Promise<void> {
  await sequelize.query(`DELETE FROM chatbot_chunks WHERE "organizationId" = :org AND "chatbotId" = :bot`, {
    replacements: { org: organizationId, bot: chatbotId },
  });
}

export interface ChunkMatch {
  content: string;
  similarity: number;
}

export async function searchChunks(
  organizationId: string,
  chatbotId: string,
  embedding: number[],
  limit = 5
): Promise<ChunkMatch[]> {
  return sequelize.query<ChunkMatch>(
    `SELECT content, 1 - (embedding <=> CAST(:vec AS vector)) AS similarity
       FROM chatbot_chunks
      WHERE "organizationId" = :org AND "chatbotId" = :bot
      ORDER BY embedding <=> CAST(:vec AS vector)
      LIMIT :limit`,
    { replacements: { org: organizationId, bot: chatbotId, vec: toVector(embedding), limit }, type: QueryTypes.SELECT }
  );
}
