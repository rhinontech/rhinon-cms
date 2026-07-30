// Mirrors backend/src/types/letterBlocks.ts — no shared package between the
// two apps (same pattern as EmployeeForm duplicating User fields).
export type LetterBlock =
  | { id: string; kind: "heading"; num?: string; text: string }
  | { id: string; kind: "subheading"; text: string }
  | { id: string; kind: "paragraph"; text: string }
  | { id: string; kind: "bullet"; marker?: string; text: string; indent?: number }
  | { id: string; kind: "numbered"; marker: string; text: string; indent?: number }
  | { id: string; kind: "pagebreak" };

// Free-form slug — admins can create additional offer_letter-category
// templates beyond the seeded full-time/intern defaults. NDA stays singular.
export type LetterTemplateKey = string;
export type LetterTemplateCategory = "offer_letter" | "nda";

export interface LetterTemplate {
  key: LetterTemplateKey;
  category: LetterTemplateCategory;
  title: string;
  blocks: LetterBlock[];
  version: number;
  updatedAt: string;
}
