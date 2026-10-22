import { Chatbot } from "../../models/Chatbot";
import { ChatbotSource } from "../../models/ChatbotSource";
import { getObjectBuffer } from "../storage";
import { runForOrg } from "../tenantContext";
import { runAcrossSites } from "../siteContext";
import { embedDocuments } from "./embeddings";
import { chunkText, extractFile, extractUrl, sitemapUrls } from "./extract";
import { emitToOrg } from "./realtime";
import { deleteSourceChunks, insertChunks } from "./vectorStore";

/**
 * Trains a bot on every source still waiting (pending or previously failed).
 *
 * Runs in-process, in the background, one bot at a time per bot — Saleszium
 * shipped this to a separate Python service and a webhook; on a t2.micro a
 * second runtime costs more than the work. Memory stays flat because each page
 * is fetched, chunked, embedded and written before the next, three at a time.
 */

const running = new Set<string>();
const PAGE_CONCURRENCY = 3;
const MAX_CHUNKS_PER_SOURCE = 2_000;

export function isTraining(chatbotId: string) {
  return running.has(chatbotId);
}

/** Starts training in the background. Returns false if this bot is already training. */
export function startTraining(organizationId: string, chatbotId: string): boolean {
  if (running.has(chatbotId)) return false;
  running.add(chatbotId);
  void runForOrg(organizationId, () => runAcrossSites(() => train(organizationId, chatbotId)), { label: "chatbot:training" })
    .catch((err) => console.error(`[Chatbot] Training ${chatbotId} crashed:`, err))
    .finally(() => running.delete(chatbotId));
  return true;
}

async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) await fn(items[next++]);
    })
  );
}

async function train(organizationId: string, chatbotId: string) {
  const bot = await Chatbot.findByPk(chatbotId);
  if (!bot) return;
  const sources = await ChatbotSource.findAll({
    where: { chatbotId, status: ["pending", "failed"] },
    order: [["createdAt", "ASC"]],
  });

  const report = async (progress: number, message: string, status: Chatbot["trainingStatus"] = "training") => {
    await bot.update({ trainingStatus: status, trainingProgress: progress, trainingMessage: message });
    emitToOrg(organizationId, "chatbot:training", { chatbotId, status, progress, message });
  };

  if (sources.length === 0) {
    await report(100, "Everything is already trained.", "idle");
    return;
  }

  await report(0, `Training ${sources.length} source${sources.length === 1 ? "" : "s"}…`);
  let failed = 0;

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    await source.update({ status: "training", error: null });
    emitToOrg(organizationId, "chatbot:source", { chatbotId, source: source.toJSON() });
    const base = Math.round((i / sources.length) * 100);
    const span = 100 / sources.length;

    try {
      // Re-training a source replaces its old chunks rather than adding to them.
      await deleteSourceChunks(organizationId, source.id);
      let chunkCount = 0;
      let pageCount = 0;

      const store = async (text: string, label: string) => {
        const pieces = chunkText(text).slice(0, MAX_CHUNKS_PER_SOURCE - chunkCount);
        if (!pieces.length) return;
        // The label rides along in the chunk so an answer can name its page.
        const withLabel = pieces.map((p) => `Source: ${label}\n${p}`);
        const vectors = await embedDocuments(withLabel);
        await insertChunks(organizationId, chatbotId, source.id, withLabel.map((content, k) => ({ content, embedding: vectors[k] })));
        chunkCount += pieces.length;
      };

      if (source.kind === "url") {
        const page = await extractUrl(source.url!);
        await store(page.text, page.title || source.url!);
        pageCount = 1;
        if (page.title && source.title === source.url) await source.update({ title: page.title.slice(0, 500) });
      } else if (source.kind === "sitemap") {
        const urls = await sitemapUrls(source.url!);
        if (!urls.length) throw new Error("No pages found in this site's sitemap.");
        let done = 0;
        await mapLimit(urls, PAGE_CONCURRENCY, async (url) => {
          try {
            const page = await extractUrl(url);
            await store(page.text, page.title || url);
            pageCount += 1;
          } catch {
            // One dead page should not fail the whole site.
          }
          done += 1;
          if (done % 5 === 0 || done === urls.length) {
            await report(Math.min(99, Math.round(base + (done / urls.length) * span)), `Reading ${source.title}: ${done}/${urls.length} pages`);
          }
        });
        if (pageCount === 0) throw new Error("None of the sitemap's pages could be read.");
      } else if (source.kind === "file") {
        const buffer = await getObjectBuffer(source.fileKey!);
        if (!buffer) throw new Error("The uploaded file is missing from storage.");
        await store(await extractFile(buffer, source.fileName || source.fileKey!), source.fileName || "Uploaded file");
        pageCount = 1;
      } else {
        await store(source.content || "", source.title);
        pageCount = 1;
      }

      if (chunkCount === 0) throw new Error("No readable text was found.");
      await source.update({ status: "trained", chunkCount, pageCount, trainedAt: new Date(), error: null });
    } catch (err: any) {
      failed += 1;
      await source.update({ status: "failed", error: String(err.message || err).slice(0, 1000) });
    }
    emitToOrg(organizationId, "chatbot:source", { chatbotId, source: source.toJSON() });
    await report(Math.min(99, Math.round(base + span)), `Trained ${i + 1} of ${sources.length}`);
  }

  await bot.update({ lastTrainedAt: new Date() });
  await report(
    100,
    failed ? `Done — ${failed} source${failed === 1 ? "" : "s"} could not be trained.` : "Training complete.",
    failed === sources.length ? "failed" : "idle"
  );
}
