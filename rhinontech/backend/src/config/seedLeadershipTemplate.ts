import { sequelize } from "./database";
import { LetterTemplate, syncDatabase } from "../models";
import type { LetterBlock } from "../types/letterBlocks";

// Dummy/demo offer-letter template — a leadership-role variant duplicated
// from offer_letter_fulltime, for exercising the multi-template picker and
// AI-rewrite flow with realistic content. Idempotent via findOrCreate.
//
// Deliberately addresses, in the seeded text itself (not left for the admin
// to fix later):
//   1. Role description reflects leadership scope, not a generic IC role.
//   2. Equity/revenue-sharing terms are stated as a concrete commitment
//      (a separate agreement executed within a bounded window), not vague.
//   3. All dates are relative/token-driven ({{dates.startLong}},
//      {{dates.acceptanceDeadline}}, "within 90 days of your joining date")
//      — nothing hardcoded, so nothing can drift out of sync with itself.
//   4. Designation consistency between the Offer Letter and NDA is
//      structural, not a copy-paste risk: both this template and the NDA
//      template resolve **{{employee.roleTitle}}** from the same employee
//      record, so they can never disagree.

const KEY = "offer_letter_leadership";
const TITLE = "Offer Letter — Leadership";

async function seedLeadershipTemplate() {
  await syncDatabase();

  const source = await LetterTemplate.findOne({ where: { key: "offer_letter_fulltime" } });
  if (!source) {
    throw new Error(`Source template "offer_letter_fulltime" not found — run db:seed:letters first.`);
  }

  const blocks: LetterBlock[] = source.blocks.map((b) => ({ ...b }));
  const byText = (needle: string) => blocks.findIndex((b) => "text" in b && b.text.includes(needle));

  // 1. Leadership-scoped role description (Section 1's second paragraph).
  const introIdx = byText("we believe in providing our employees with the best learning experience");
  if (introIdx !== -1) {
    (blocks[introIdx] as { text: string }).text =
      "As a company that values visionary leadership, strategic thinking, and a passion for building high-performing teams, we believe you will play a pivotal role in shaping Rhinon Tech's direction. Through this employment, you will be entrusted with significant ownership over key initiatives that directly influence the company's growth and long-term success.";
  }

  // 1 (cont'd). Section 2's second paragraph — replace generic "gain skills" framing with leadership responsibilities.
  const roleBlurbIdx = byText("This role will help you gain skills in Product Development and AI");
  if (roleBlurbIdx !== -1) {
    (blocks[roleBlurbIdx] as { text: string }).text =
      "As **{{employee.roleTitle}}**, you will be responsible for setting strategic direction, leading and mentoring cross-functional teams, and driving key business outcomes in close partnership with the founding team.";
  }

  // Section 3 — add a reporting-line bullet right after Designation, reinforcing the leadership framing.
  const designationIdx = byText("**Designation:**");
  if (designationIdx !== -1) {
    blocks.splice(designationIdx + 1, 0, {
      id: "leadership-reporting-line",
      kind: "bullet",
      text: "**Reporting Line:** You will report directly to the Founder/CEO and collaborate closely with senior leadership.",
    });
  }

  // 2. Equity / revenue-sharing terms — concrete commitment, not vague language.
  // Inserted right after the CTC paragraph in Section 4.
  const ctcIdx = byText("Your starting compensation package includes an annual CTC");
  if (ctcIdx !== -1) {
    blocks.splice(ctcIdx + 1, 0, {
      id: "leadership-equity",
      kind: "paragraph",
      text: "**Equity & Revenue Sharing:** In recognition of your leadership role, you will be eligible for equity participation and/or a revenue-sharing arrangement. The specific terms — vesting schedule, percentage, and eligibility conditions — will be documented in a separate Equity/Revenue-Sharing Agreement to be executed within **90 days** of your joining date.",
    });
  }

  const [template, created] = await LetterTemplate.findOrCreate({
    where: { key: KEY },
    defaults: { key: KEY, category: "offer_letter", title: TITLE, blocks, version: 1 },
  });
  console.log(`${created ? "Created" : "Already exists"}: ${template.key} (${template.blocks.length} blocks)`);

  await sequelize.close();
  console.log("Leadership template seed complete.");
}

seedLeadershipTemplate().catch((err) => {
  console.error("Leadership template seed failed:", err);
  process.exit(1);
});
