import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { User, LetterTemplate } from "../models";
import { getObjectBuffer, SIGNATURE_KEY } from "./storage";
import type { LetterBlock, LetterTemplateKey, LetterTokenMap } from "../types/letterBlocks";

export type LetterType = "relieving" | "experience";

// Bundled letterhead logo (full logotype, dark-blue on transparent) — copied into
// dist/assets by `npm run build` (see package.json).
const LOGO_PATH = path.join(__dirname, "../assets/logo.png");
const LOGO_ASPECT = 1383 / 380; // width / height of assets/logo.png
const logoBuffer = fs.existsSync(LOGO_PATH) ? fs.readFileSync(LOGO_PATH) : null;

function fmtDate(value: unknown) {
  if (!value) return "—";
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function refNumber(type: LetterType, user: User) {
  const prefix = type === "relieving" ? "RL" : "EL";
  const year = new Date().getFullYear();
  return `RT/${prefix}/${year}/${user.id.slice(0, 8).toUpperCase()}`;
}

export function letterTitle(type: LetterType) {
  return type === "relieving" ? "Relieving Letter" : "Experience Letter";
}

function letterParagraphs(type: LetterType, user: User): { salutation: string; paragraphs: string[] } {
  const name = user.legalName || user.fullName;
  const title = user.roleTitle || "their role";
  const dept = user.department;
  const joined = fmtDate(user.joiningDate);
  const left = fmtDate(user.exitDate);

  if (type === "relieving") {
    const cause = user.exitReason === "Resignation"
      ? "With reference to your resignation, we"
      : "This is to confirm that we";
    return {
      salutation: `Dear ${name},`,
      paragraphs: [
        `${cause} hereby relieve you from your duties as ${title} in the ${dept} department at Rhinon Tech, effective close of business on ${left}.`,
        `You were associated with us from ${joined} to ${left}. All company property, credentials, and access in your possession are deemed returned and revoked as of your last working day. Your full and final settlement will be processed as per company policy.`,
        `We thank you for your contribution to Rhinon Tech and wish you every success in your future endeavours.`,
      ],
    };
  }

  return {
    salutation: "TO WHOMSOEVER IT MAY CONCERN",
    paragraphs: [
      `This is to certify that ${name} was employed with Rhinon Tech as ${title} in the ${dept} department from ${joined} to ${left}.`,
      `During their tenure with us, we found ${name} to be sincere, professional, and dedicated to their responsibilities.`,
      `We wish them all the best in their future endeavours.`,
    ],
  };
}

export async function generateLetterPdf(type: LetterType, user: User): Promise<Buffer> {
  // Fetched once per letter — cheap, and lets a newly-uploaded signature apply
  // immediately without redeploying.
  const signatureBuffer = await getObjectBuffer(SIGNATURE_KEY).catch(() => null);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margins: { top: 64, bottom: 64, left: 64, right: 64 } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 128;

    // Letterhead
    if (logoBuffer) {
      const logoWidth = 170;
      doc.image(logoBuffer, 64, doc.y, { width: logoWidth, height: logoWidth / LOGO_ASPECT });
      doc.y += logoWidth / LOGO_ASPECT + 6;
    } else {
      doc.font("Helvetica-Bold").fontSize(20).fillColor("#111111").text("Rhinon Tech", { align: "left" });
    }
    doc.font("Helvetica").fontSize(9).fillColor("#666666").text("www.rhinon.tech", { align: "left" });
    doc.moveDown(0.5);
    doc.moveTo(64, doc.y).lineTo(64 + pageWidth, doc.y).lineWidth(1).strokeColor("#111111").stroke();
    doc.moveDown(1.5);

    // Ref + date
    doc.font("Helvetica").fontSize(10).fillColor("#333333");
    doc.text(`Ref: ${refNumber(type, user)}`, { continued: false });
    doc.text(`Date: ${fmtDate(new Date().toISOString())}`, { align: "right" });
    doc.moveDown(1.5);

    // Title
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#111111")
      .text(letterTitle(type).toUpperCase(), { align: "center", underline: true });
    doc.moveDown(1.5);

    // Body
    const { salutation, paragraphs } = letterParagraphs(type, user);
    doc.font(type === "experience" ? "Helvetica-Bold" : "Helvetica").fontSize(11).fillColor("#222222")
      .text(salutation);
    doc.moveDown(0.75);
    doc.font("Helvetica").fontSize(11).fillColor("#222222");
    for (const p of paragraphs) {
      doc.text(p, { align: "justify", lineGap: 3 });
      doc.moveDown(0.75);
    }

    // Signature block
    doc.moveDown(2);
    doc.font("Helvetica").fontSize(11).fillColor("#222222").text("For Rhinon Tech,");
    if (signatureBuffer) {
      const sigWidth = 130;
      doc.image(signatureBuffer, 64, doc.y + 4, { fit: [sigWidth, 55] });
      doc.y += 55 + 8;
    } else {
      doc.moveDown(3); // blank space reserved for a signature to be added later
    }
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#222222").text("Authorized Signatory");
    doc.font("Helvetica").fontSize(9).fillColor("#666666").text("Rhinon Tech");

    // Footer
    doc.fontSize(8).fillColor("#999999")
      .text("This is a system-generated letter issued by Rhinon Tech.", 64, doc.page.height - 84, {
        width: pageWidth,
        align: "center",
      });

    doc.end();
  });
}

function money(value?: number | string) {
  return `INR ${Number(value || 0).toLocaleString("en-IN")}`;
}

function getOrdinal(d: number) {
  if (d > 3 && d < 21) return "th";
  switch (d % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
  }
}

function drawHeader(doc: PDFKit.PDFDocument, logo: Buffer | null) {
  if (logo) {
    const logoWidth = 130;
    doc.image(logo, doc.page.margins.left, 30, { width: logoWidth, height: logoWidth / LOGO_ASPECT });
  } else {
    doc.font("Helvetica-Bold").fontSize(16).fillColor("#005085").text("RHINON TECH", doc.page.margins.left, 30);
  }
  doc.y = 100; // clear air between the letterhead and the first line of content
}

// Starts a new page when fewer than `needed` points remain before the bottom
// margin — keeps headings from sitting orphaned at the foot of a page and
// signature blocks from straddling a page break.
function ensureRoom(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

// Letterhead on every page: pageAdded fires for both manual addPage() calls and
// automatic mid-paragraph page breaks. doc.x is preserved so a break inside a
// hanging-indent list item continues at the correct offset, not the margin.
function useLetterhead(doc: PDFKit.PDFDocument) {
  drawHeader(doc, logoBuffer);
  doc.on("pageAdded", () => {
    const x = doc.x;
    drawHeader(doc, logoBuffer);
    doc.x = x;
  });
}

function drawSectionHeading(doc: PDFKit.PDFDocument, num: string | undefined, text: string) {
  ensureRoom(doc, 60); // heading plus at least two lines of the body it introduces
  doc.fillColor("#005085").font("Helvetica-Bold").fontSize(11.5).text(num ? `${num}. ${text}` : text, { lineGap: 2 });
  doc.fillColor("#222222").font("Helvetica").fontSize(10);
  doc.moveDown(0.45);
}

function drawSubHeading(doc: PDFKit.PDFDocument, text: string) {
  ensureRoom(doc, 50);
  doc.fillColor("#222222").font("Helvetica-Bold").fontSize(10.5).text(text, { lineGap: 2 });
  doc.font("Helvetica").fontSize(10);
  doc.moveDown(0.15);
}

function drawFormattedText(doc: PDFKit.PDFDocument, text: string, options: any = {}) {
  const parts = text.split("**");
  const x = options.x || doc.x;
  const y = options.y || doc.y;
  const lineGap = options.lineGap || 3;
  const width = options.width || (doc.page.width - 120);

  // PDFKit's continued-text mode silently drops a leading space on a segment
  // that starts a new .text() call — shift any such space onto the end of the
  // PREVIOUS segment instead (a trailing space renders fine), so "**Bold**
  // next-word" never collapses into "Boldnext-word".
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].startsWith(" ")) {
      parts[i - 1] += " ";
      parts[i] = parts[i].slice(1);
    }
  }

  doc.text("", x, y);

  parts.forEach((part, index) => {
    const isBold = index % 2 === 1;
    doc.font(isBold ? "Helvetica-Bold" : "Helvetica");
    const isLast = index === parts.length - 1;
    doc.text(part, {
      continued: !isLast,
      align: options.align || "justify",
      lineGap: lineGap,
      width: width,
    });
  });

  if (options.moveDown) {
    doc.moveDown(options.moveDown);
  }
}

// One list item with a real hanging indent: the marker ("•", "12.", "a.") sits
// in its own column and every wrapped line aligns under the text, not back at
// the margin. Supports the same **bold** markup as drawFormattedText.
function drawListItem(
  doc: PDFKit.PDFDocument,
  marker: string,
  text: string,
  options: { indent?: number; markerWidth?: number; lineGap?: number; moveDown?: number } = {}
) {
  const left = doc.page.margins.left + (options.indent || 0);
  const markerWidth = options.markerWidth ?? 13;
  const bodyX = left + markerWidth;
  const bodyWidth = doc.page.width - doc.page.margins.right - bodyX;
  const lineGap = options.lineGap ?? 3;

  ensureRoom(doc, 16); // marker and first body line always start on the same page
  const y = doc.y;
  doc.font("Helvetica").fontSize(10).text(marker, left, y, { width: markerWidth, lineGap });
  doc.y = y;

  const parts = text.split("**");
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].startsWith(" ")) {
      parts[i - 1] += " ";
      parts[i] = parts[i].slice(1);
    }
  }
  parts.forEach((part, index) => {
    const isBold = index % 2 === 1;
    const isLast = index === parts.length - 1;
    doc.font(isBold ? "Helvetica-Bold" : "Helvetica");
    if (index === 0) {
      doc.text(part, bodyX, y, { continued: !isLast, width: bodyWidth, lineGap, align: "justify" });
    } else {
      doc.text(part, { continued: !isLast, width: bodyWidth, lineGap, align: "justify" });
    }
  });

  doc.x = doc.page.margins.left;
  doc.moveDown(options.moveDown ?? 0.15);
}

// --- Block-based template rendering ---------------------------------------
// The offer letter's numbered sections and the NDA's Background + 37-clause
// body are the parts an admin would plausibly want to reword (see
// LetterTemplate) — they're stored in the DB as LetterBlock[] with `{{token}}`
// placeholders and rendered here via the same drawX helpers used above.
// Everything else (letterhead, date, salutation, party block, signature
// blocks) stays fixed code below: it's derived from data, not editable prose,
// and is tightly coupled to signature stamping / exact x,y layout.

// Fills `{{a.b}}` placeholders in every block's text against a flat token map.
// Unknown placeholders are left as-is rather than throwing, so a stale
// template referencing a removed token still renders instead of crashing.
export function resolveBlocks(blocks: LetterBlock[], tokens: LetterTokenMap): LetterBlock[] {
  const sub = (text: string) => text.replace(/\{\{([\w.]+)\}\}/g, (m, key) => (key in tokens ? tokens[key] : m));
  return blocks.map((b) => (b.kind === "pagebreak" ? b : { ...b, text: sub(b.text) }));
}

// Splices per-employee AI/manual edits (made in the create-member form, keyed
// by block id) onto an already-resolved blocks array, without touching the
// shared template. Unmatched ids are ignored (defensive against a stale id
// from a template that changed between preview and submit).
export function applyBlockOverrides(blocks: LetterBlock[], overrides?: { blockId: string; text: string }[]): LetterBlock[] {
  if (!overrides || overrides.length === 0) return blocks;
  const overrideMap = new Map(overrides.map((o) => [o.blockId, o.text]));
  return blocks.map((b) => (b.kind !== "pagebreak" && overrideMap.has(b.id) ? { ...b, text: overrideMap.get(b.id)! } : b));
}

// Renders a resolved LetterBlock[] (no remaining {{tokens}}) into an
// in-progress PDFKit document, dispatching to the same primitives the
// original imperative letters used.
export function renderBlocksToPdf(doc: PDFKit.PDFDocument, blocks: LetterBlock[]) {
  const pageWidth = doc.page.width - 120;
  for (const block of blocks) {
    switch (block.kind) {
      case "heading":
        drawSectionHeading(doc, block.num, block.text);
        break;
      case "subheading":
        drawSubHeading(doc, block.text);
        break;
      case "paragraph":
        drawFormattedText(doc, block.text, { width: pageWidth, moveDown: 0.45 });
        break;
      case "bullet":
        drawListItem(doc, block.marker ?? "•", block.text, { indent: block.indent, moveDown: 0.15 });
        break;
      case "numbered":
        drawListItem(doc, block.marker, block.text, { indent: block.indent, markerWidth: block.indent ? 14 : 18, moveDown: 0.15 });
        break;
      case "pagebreak":
        doc.addPage();
        break;
    }
  }
}

// Mirrors every computed value the imperative letters used to inline
// directly (ordinal dates, intern end-date, acceptance deadline, rounded
// stipend) — templates only ever see the resolved string, never the math.
function buildTokenMap(user: User, isIntern: boolean): LetterTokenMap {
  const today = new Date();
  const fmtLong = (d: Date) => `${d.getDate()}${getOrdinal(d.getDate())} ${d.toLocaleDateString("en-US", { month: "long" })}, ${d.getFullYear()}`;

  const startD = user.joiningDate ? new Date(user.joiningDate) : new Date();
  const internEndD = new Date(startD.getFullYear(), startD.getMonth() + 6, startD.getDate());
  const acceptD = new Date(startD.getTime() + 7 * 24 * 60 * 60 * 1000);

  const empType = user.employmentType || "Full-Time";
  const monthlyStipend = user.annualCompensation ? Math.round(Number(user.annualCompensation) / 12) : 5000;

  return {
    "employee.fullName": user.fullName,
    "employee.firstName": user.fullName.split(" ")[0],
    "employee.legalName": user.legalName || user.fullName,
    "employee.roleTitle": user.roleTitle || (isIntern ? "NextJs Developer Intern" : "NextJs Developer"),
    "employee.department": user.department || "",
    "employee.workLocationShort": user.workLocation || "Bengaluru",
    "employee.locationLine": `${user.workLocation || "Bengaluru"}${user.remotePosition ? " (Remote)" : ""}`,
    "employee.workLocationOrIndia": user.workLocation || "India",
    "employee.workScheduleOrDefault": user.workSchedule || (isIntern ? "48 hours per week" : "40 hours per week"),
    "employee.workingHours": user.workSchedule || "11 AM – 8 PM (Mon–Sat)",
    "employee.employmentTypeLabel": empType === "Full-Time" ? "Full-Time / Permanent" : empType,
    "dates.todayLong": fmtLong(today),
    "dates.startLong": fmtLong(startD),
    "dates.internStartShort": shortDate(startD),
    "dates.internEndShort": shortDate(internEndD),
    "dates.acceptanceDeadline": fmtLong(acceptD),
    "compensation.annualCtcOrDiscussed": user.annualCompensation ? money(user.annualCompensation) : "As discussed",
    "compensation.monthlyStipend": String(monthlyStipend),
    "support.email": "info@rhinontech.com",
  };
}

function templateKeyForOfferLetter(isIntern: boolean): LetterTemplateKey {
  return isIntern ? "offer_letter_intern" : "offer_letter_fulltime";
}

// Loads a template row and resolves it against a specific (real or draft)
// user — used by the live preview endpoint and as the default content when
// nothing has been AI-edited yet. `templateKey` lets the admin explicitly
// pick among multiple offer_letter-category templates (the create-member
// form's dropdown); NDA has no picker — it's always the single "nda"-category
// row. Falls back through explicit key -> employmentType default -> any
// template in the category, so a stale/renamed key never hard-fails.
export async function resolveLetterBlocks(
  type: "offer" | "nda",
  user: User,
  templateKey?: string
): Promise<{ blocks: LetterBlock[]; templateVersion: number; tokens: LetterTokenMap; templateKey: string; templateTitle: string }> {
  const isIntern = user.employmentType?.toLowerCase().startsWith("intern") ?? false;

  let template: LetterTemplate | null = null;
  if (type === "nda") {
    template = await LetterTemplate.findOne({ where: { category: "nda" } });
  } else {
    if (templateKey) {
      template = await LetterTemplate.findOne({ where: { key: templateKey, category: "offer_letter" } });
    }
    if (!template) {
      template = await LetterTemplate.findOne({ where: { key: templateKeyForOfferLetter(isIntern) } });
    }
    if (!template) {
      template = await LetterTemplate.findOne({ where: { category: "offer_letter" }, order: [["createdAt", "ASC"]] });
    }
  }
  if (!template) throw new Error(`No letter template is configured for "${type}".`);

  const tokens = buildTokenMap(user, isIntern);
  return {
    blocks: resolveBlocks(template.blocks, tokens),
    templateVersion: template.version,
    tokens,
    templateKey: template.key,
    templateTitle: template.title,
  };
}

export type LetterSignature =
  | { type: "typed"; fullName: string; signedAt: Date }
  | { type: "drawn"; imageBuffer: Buffer; signedAt: Date };

function shortDate(d: Date) {
  return d.toLocaleDateString("en-GB").replace(/\//g, "-");
}

// Draws a "Signature: ___" line — a typed name (script-style italic), a drawn
// signature image, or (unsigned) a blank line to sign by hand — followed by a
// date line that reflects the actual signing date once signed.
function drawSignatureLine(doc: PDFKit.PDFDocument, signature: LetterSignature | undefined, fallbackDate: string, x = 60) {
  ensureRoom(doc, 115); // never split the signature block across a page break
  doc.font("Helvetica").fontSize(10).fillColor("#222222").text("Signature:", { lineGap: 2 });
  if (signature?.type === "typed") {
    const size = signature.fullName.length > 24 ? 13 : signature.fullName.length > 16 ? 15 : 18;
    doc.font("Times-Italic").fontSize(size).text(signature.fullName, x, doc.y);
    doc.font("Helvetica").fontSize(10);
  } else if (signature?.type === "drawn") {
    const sigY = doc.y;
    doc.image(signature.imageBuffer, x, sigY, { fit: [200, 55] });
    doc.y = sigY + 58;
  } else {
    doc.font("Helvetica-Bold").text("_______________________", { lineGap: 3 });
    doc.font("Helvetica").fontSize(10);
  }
  doc.moveDown(0.3);
  const dateStr = signature ? shortDate(signature.signedAt) : fallbackDate;
  doc.font("Helvetica-Bold").text(`Date: ${dateStr}`);
}

export async function generateOfferLetterPdf(
  user: User,
  signature?: LetterSignature,
  contentBlocks?: LetterBlock[]
): Promise<Buffer> {
  const signatureBuffer = await getObjectBuffer(SIGNATURE_KEY).catch(() => null);
  // Resolved+edited content, if provided (e.g. from Document.contentBlocks at
  // signing time), takes precedence over resolving the live template fresh —
  // that's what makes a pre-send AI edit survive to the signed PDF.
  const blocks = contentBlocks ?? (await resolveLetterBlocks("offer", user)).blocks;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margins: { top: 100, bottom: 60, left: 60, right: 60 } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 120;

    // Content flows naturally across pages (no manual page breaks) — the
    // letterhead is repeated on every page and headings are kept with the
    // text they introduce (see ensureRoom/useLetterhead).
    useLetterhead(doc);

    doc.font("Helvetica-Bold").fontSize(12).fillColor("#005085").text("PRIVATE & CONFIDENTIAL", { align: "center" });
    doc.moveDown(0.75);

    // Date
    const today = new Date();
    const ordinalDay = getOrdinal(today.getDate());
    const dateStr = `${today.getDate()}${ordinalDay} ${today.toLocaleDateString("en-US", { month: "long" })}, ${today.getFullYear()}`;

    doc.fillColor("#222222").font("Helvetica").fontSize(10);
    doc.text(dateStr, { lineGap: 2 });
    doc.font("Helvetica-Bold").text(user.legalName || user.fullName, { lineGap: 2 });
    doc.font("Helvetica").text(user.workLocation || "Bengaluru, India", { lineGap: 2 });
    doc.moveDown(0.75);

    doc.text(`Dear ${user.fullName.split(" ")[0]},`);
    doc.moveDown(0.5);

    // Sections 1-9 — resolved (and possibly AI-edited) prose, either loaded
    // fresh from the LetterTemplate or passed in via `blocks` above.
    const startD = user.joiningDate ? new Date(user.joiningDate) : new Date();
    const fmtStartShort = shortDate(startD);

    renderBlocksToPdf(doc, blocks);
    doc.moveDown(0.5);

    ensureRoom(doc, 100); // sign-off never splits across pages
    doc.text("Best regards,", { lineGap: 2 });
    doc.moveDown(0.3);
    if (signatureBuffer) {
      doc.image(signatureBuffer, 60, doc.y, { fit: [110, 40] });
      doc.y += 44;
    } else {
      doc.moveDown(1);
    }
    doc.font("Helvetica-Bold").text("Prabhat Patra (Founder)");

    // Acknowledgment — deliberately its own page: it's the tear-off sheet the
    // employee signs (or the e-signing flow stamps).
    doc.addPage();

    doc.font("Helvetica-Bold").fontSize(12).fillColor("#005085").text("Rhinon Tech Acknowledgment of Offer", { align: "center" });
    doc.moveDown(0.75);
    doc.fillColor("#222222").font("Helvetica").fontSize(10);

    drawFormattedText(doc, `I, **${user.legalName || user.fullName}**, accept the offer of the **${user.roleTitle || "NextJs Developer"}** position at Rhinon Tech under the terms stated in this letter.`, { width: pageWidth, moveDown: 1 });

    drawSignatureLine(doc, signature, fmtStartShort);

    doc.end();
  });
}

export async function generateNdaPdf(
  user: User,
  signature?: LetterSignature,
  contentBlocks?: LetterBlock[]
): Promise<Buffer> {
  const signatureBuffer = await getObjectBuffer(SIGNATURE_KEY).catch(() => null);
  const blocks = contentBlocks ?? (await resolveLetterBlocks("nda", user)).blocks;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margins: { top: 100, bottom: 60, left: 60, right: 60 } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 120;
    const employeeName = user.legalName || user.fullName;
    const loc = user.workLocation || "India";

    useLetterhead(doc);

    doc.font("Helvetica-Bold").fontSize(12).fillColor("#005085").text("NON-DISCLOSURE & CONFIDENTIALITY AGREEMENT", { align: "center" });
    doc.moveDown(0.6);

    const today = new Date();
    const ordinalDay = getOrdinal(today.getDate());
    const dateStr = `${today.getDate()}${ordinalDay} ${today.toLocaleDateString("en-US", { month: "long" })}, ${today.getFullYear()}`;

    doc.fillColor("#222222").font("Helvetica").fontSize(10);
    doc.text(`This Non-Disclosure and Confidentiality Agreement (the "Agreement") is dated this ${dateStr}.`, { align: "justify", lineGap: 2 });
    doc.moveDown(0.4);

    doc.text("BETWEEN:", { lineGap: 2 });
    doc.font("Helvetica-Bold").text("Rhinon Tech Private Limited", { continued: true }).font("Helvetica").text(` (the "Employer")`);
    doc.text("OF THE FIRST PART", { lineGap: 2 });
    doc.moveDown(0.2);
    doc.text("- AND -", { lineGap: 2 });
    doc.font("Helvetica-Bold").text(employeeName, { continued: true }).font("Helvetica").text(` of ${loc} (the "Employee")`);
    doc.text("OF THE SECOND PART", { lineGap: 2 });
    doc.moveDown(0.5);

    // BACKGROUND clauses, the "agree as follows" paragraph, and the 37-clause
    // body are all editable template content — see LetterTemplate key "nda".
    renderBlocksToPdf(doc, blocks);
    doc.moveDown(0.3);

    // --- Signatures ---
    const signedDateStr = signature
      ? `${signature.signedAt.getDate()}${getOrdinal(signature.signedAt.getDate())} ${signature.signedAt.toLocaleDateString("en-US", { month: "long" })}, ${signature.signedAt.getFullYear()}`
      : dateStr;
    ensureRoom(doc, 125); // witness line + both signature columns stay together
    doc.font("Helvetica").fontSize(10).text(`IN WITNESS WHEREOF Rhinon Tech and ${employeeName} have duly affixed their signatures on this ${signedDateStr}.`, { width: pageWidth, lineGap: 2 });
    doc.moveDown(0.6);

    const startY = doc.y;
    doc.font("Helvetica").fontSize(10).text("For Rhinon Tech,", 60, startY);
    if (signatureBuffer) {
      doc.image(signatureBuffer, 60, startY + 16, { fit: [110, 36] });
    }
    doc.font("Helvetica-Bold").text("Authorized Signatory", 60, startY + 58);

    const empX = doc.page.width / 2 + 20;
    doc.font("Helvetica").fontSize(10).text("Accepted & Agreed By:", empX, startY);
    if (signature?.type === "typed") {
      const size = signature.fullName.length > 24 ? 13 : signature.fullName.length > 16 ? 15 : 18;
      doc.font("Times-Italic").fontSize(size).text(signature.fullName, empX, startY + 16);
    } else if (signature?.type === "drawn") {
      doc.image(signature.imageBuffer, empX, startY + 16, { fit: [110, 36] });
    } else {
      doc.font("Helvetica-Bold").fontSize(10).text(employeeName, empX, startY + 16);
    }
    doc.font("Helvetica-Bold").fontSize(10).text(employeeName, empX, startY + 58);
    doc.font("Helvetica").fontSize(9.5).text(`Date: ${shortDate(signature?.signedAt ?? today)}`, empX, startY + 72);

    doc.end();
  });
}

