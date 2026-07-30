// Shared block model for offer letters and NDAs — replaces hardcoded prose in
// services/letters.ts so letter text can live in the DB (LetterTemplate) and be
// edited (manually or via AI) per-template or per-employee (Document.contentBlocks).
// Mirrored in admin-panel/types/letterBlocks.ts (no shared package between the
// two apps — matches how EmployeeForm already duplicates User fields).
export type LetterBlock =
  // num is present for the offer letter's "1. Introduction..." style numbered
  // sections; omitted for the NDA's bare section titles ("Confidential Information").
  | { id: string; kind: "heading"; num?: string; text: string }
  | { id: string; kind: "subheading"; text: string }
  | { id: string; kind: "paragraph"; text: string }
  | { id: string; kind: "bullet"; marker?: string; text: string; indent?: number }
  | { id: string; kind: "numbered"; marker: string; text: string; indent?: number }
  | { id: string; kind: "pagebreak" };

// `key` used to be a closed 3-value enum; it's now a free-form slug so admins
// can create additional named offer-letter templates (e.g. "Offer Letter —
// Contractor") beyond the seeded full-time/intern defaults. NDA stays a
// single template — no create/duplicate UI for that category.
export type LetterTemplateCategory = "offer_letter" | "nda";
export type LetterTemplateKey = string;

// {{a.b}} placeholders inside a block's `text`, resolved against a flat map
// built by buildTokenMap(user) in services/letters.ts.
export type LetterTokenMap = Record<string, string>;
