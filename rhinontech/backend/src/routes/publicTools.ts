import { Router, type Request, type Response } from "express";
import { LENGTHS, PURPOSES, TONES, takeDailySlot, writeEmail, type EmailWriterInput } from "../services/publicEmailWriter";

/**
 * Free marketing tools on rhinontech.com. Unauthenticated, no tenant, no database writes.
 * Per-IP rate limits are applied where this router is mounted (app.ts); the service adds a
 * global daily cap. Errors never echo model output or internals back to the caller.
 */
const router = Router();

const oneOf = <T extends readonly string[]>(list: T, v: unknown): v is T[number] => typeof v === "string" && (list as readonly string[]).includes(v);
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** POST /public/tools/email-writer — { purpose, tone, length, recipient, context, senderName? } */
router.post("/email-writer", async (req: Request, res: Response) => {
  const b = req.body ?? {};
  const input: EmailWriterInput = {
    purpose: oneOf(PURPOSES, b.purpose) ? b.purpose : "cold-outreach",
    tone: oneOf(TONES, b.tone) ? b.tone : "friendly",
    length: oneOf(LENGTHS, b.length) ? b.length : "short",
    recipient: text(b.recipient, 160),
    context: text(b.context, 800),
    senderName: text(b.senderName, 60) || undefined,
  };
  if (input.recipient.length < 2 || input.context.length < 10) {
    res.status(400).json({ message: "Tell us who you are writing to and a sentence about why." });
    return;
  }
  if (!takeDailySlot()) {
    res.status(503).json({ message: "The email writer is busy today. Please try again tomorrow." });
    return;
  }
  try {
    const result = await Promise.race([
      writeEmail(input),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 25_000)),
    ]);
    res.json(result);
  } catch (err) {
    console.error("[public-tools] email-writer failed:", err instanceof Error ? err.message : err);
    res.status(502).json({ message: "We couldn't write that one. Please try again." });
  }
});

export default router;
