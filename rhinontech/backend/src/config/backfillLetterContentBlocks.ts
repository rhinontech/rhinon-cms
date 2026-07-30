import { sequelize } from "./database";
import { Document, User, syncDatabase } from "../models";
import { resolveLetterBlocks } from "../services/letters";

// One-time migration companion to seedLetterTemplates.ts: existing offer_letter/nda
// Document rows created before the contentBlocks column existed have no snapshot,
// so documentSigning.ts falls back to regenerating from live User fields. That
// fallback is fine indefinitely for already-signed documents (they're a finalized
// historical record), but unsigned ones should get a real snapshot so a signature
// captured after this deploy renders from the same resolved template content the
// admin actually saw in preview. Run once after `db:seed:letters`.
async function backfill() {
  await syncDatabase();

  const docs = await Document.findAll({
    where: { contentBlocks: null, signedAt: null },
  });

  let updated = 0;
  for (const doc of docs) {
    if (doc.category !== "offer_letter" && doc.category !== "nda") continue;
    const user = await User.findByPk(doc.employeeId);
    if (!user) continue;

    try {
      const { blocks, templateVersion } = await resolveLetterBlocks(
        doc.category === "nda" ? "nda" : "offer",
        user
      );
      await doc.update({ contentBlocks: blocks, templateVersion });
      updated++;
    } catch (err) {
      console.error(`Failed to backfill contentBlocks for document ${doc.id}:`, err);
    }
  }

  console.log(`Backfilled ${updated} unsigned document(s).`);
  await sequelize.close();
}

backfill().catch((err) => {
  console.error("contentBlocks backfill failed:", err);
  process.exit(1);
});
