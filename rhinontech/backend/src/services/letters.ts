import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { User } from "../models";
import { getObjectBuffer, SIGNATURE_KEY } from "./storage";

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
    const logoWidth = 110;
    doc.image(logo, (doc.page.width - logoWidth) / 2, 30, { width: logoWidth, height: logoWidth / LOGO_ASPECT });
  } else {
    doc.font("Helvetica-Bold").fontSize(16).fillColor("#005085").text("RHINON TECH", 0, 30, { align: "center", width: doc.page.width });
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

function drawSectionHeading(doc: PDFKit.PDFDocument, num: string, text: string) {
  ensureRoom(doc, 60); // heading plus at least two lines of the body it introduces
  doc.fillColor("#005085").font("Helvetica-Bold").fontSize(11.5).text(`${num}. ${text}`, { lineGap: 2 });
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

export async function generateOfferLetterPdf(user: User, signature?: LetterSignature): Promise<Buffer> {
  const signatureBuffer = await getObjectBuffer(SIGNATURE_KEY).catch(() => null);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margins: { top: 100, bottom: 60, left: 60, right: 60 } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 120;
    // The admin form's option is "Intern"; older data may say "Internship" —
    // match both rather than one exact string.
    const isIntern = user.employmentType?.toLowerCase().startsWith("intern") ?? false;

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

    // Section 1
    drawSectionHeading(doc, "1", "Introduction to Rhinon Tech");
    drawFormattedText(doc, `We are thrilled to offer you the opportunity to ${isIntern ? "intern" : "work"} with **Rhinon Tech**, a cutting-edge technology company dedicated to pushing the boundaries of innovation and excellence. Since our inception, Rhinon Tech has been at the forefront of developing scalable solutions and empowering industries with the tools to grow in a highly competitive marketplace.`, { width: pageWidth, moveDown: 0.4 });
    drawFormattedText(doc, `As a company that values creativity, innovation, and a passion for technology, we believe in providing our ${isIntern ? "interns" : "employees"} with the best learning experience and preparing them for future roles in the industry. Through this ${isIntern ? "internship" : "employment"}, you will be involved in projects that contribute directly to Rhinon Tech's mission.`, { width: pageWidth, moveDown: 0.6 });

    // Section 2
    const startD = user.joiningDate ? new Date(user.joiningDate) : new Date();
    const endD = new Date(startD.getFullYear(), startD.getMonth() + 6, startD.getDate());

    const startOrd = getOrdinal(startD.getDate());
    const startStr = `${startD.getDate()}${startOrd} ${startD.toLocaleDateString("en-US", { month: "long" })}, ${startD.getFullYear()}`;

    const endOrd = getOrdinal(endD.getDate());
    const endStr = `${endD.getDate()}${endOrd} ${endD.toLocaleDateString("en-US", { month: "long" })}, ${endD.getFullYear()}`;

    const fmtStartShort = shortDate(startD);
    const fmtEndShort = shortDate(endD);

    drawSectionHeading(doc, "2", isIntern ? "Offer of Internship" : "Offer of Employment");
    drawFormattedText(doc, `We are pleased to offer you the position of **${user.roleTitle || (isIntern ? "NextJs Developer Intern" : "NextJs Developer")}** ${isIntern ? `for a period of **6 months** starting from **${fmtStartShort}** to **${fmtEndShort}**` : `starting from **${startStr}**`}. This position is an important step toward building your professional experience, and we look forward to seeing your contributions in real-world projects.`, { width: pageWidth, moveDown: 0.4 });
    drawFormattedText(doc, `This role will help you gain skills in Product Development and AI with talented professionals and get exposure to cutting-edge technologies.`, { width: pageWidth, moveDown: 0.6 });

    // Section 3
    drawSectionHeading(doc, "3", isIntern ? "Internship Position Details" : "Employment Position Details");

    drawListItem(doc, "•", `**Designation:** ${user.roleTitle || "NextJs Developer"}`);
    drawListItem(doc, "•", `**Location:** ${user.workLocation || "Bengaluru"}${user.remotePosition ? " (Remote)" : ""}`);
    if (isIntern) {
      drawListItem(doc, "•", "**Internship Duration:** 6 months");
    } else {
      const empType = user.employmentType || "Full-Time";
      drawListItem(doc, "•", `**Employment Type:** ${empType === "Full-Time" ? "Full-Time / Permanent" : empType}`);
    }
    drawListItem(doc, "•", `**Work Schedule:** ${user.workSchedule || (isIntern ? "48 hours per week" : "40 hours per week")}`);
    doc.moveDown(0.45);

    // Section 4
    drawSectionHeading(doc, "4", "Compensation and Benefits");

    const monthlyStipendVal = user.annualCompensation ? Math.round(Number(user.annualCompensation) / 12) : 5000;

    if (isIntern) {
      drawFormattedText(doc, `During your internship period, this is a paid internship for **${monthlyStipendVal}/- per month**. After three months, there will be a review meeting to assess your performance, and based on this review, we will decide on future opportunities and compensation.`, { width: pageWidth, moveDown: 0.5 });
    } else {
      const ctcVal = user.annualCompensation ? money(user.annualCompensation) : "As discussed";
      drawFormattedText(doc, `Your starting compensation package includes an annual CTC of **${ctcVal}** paid on a **monthly basis** in accordance with our standard payroll cycle. Your compensation will be subject to annual performance reviews.`, { width: pageWidth, moveDown: 0.5 });
    }

    doc.text(`You will enjoy the following benefits as ${isIntern ? "an intern" : "an employee"} at Rhinon Tech:`);
    doc.moveDown(0.3);

    drawListItem(doc, "•", `**Mentorship:** You will be assigned a mentor who will provide guidance throughout your ${isIntern ? "internship" : "tenure"}.`);
    drawListItem(doc, "•", "**Workshops and Training:** Access to internal training programs and workshops that align with your field of work.");
    drawListItem(doc, "•", "**Networking Opportunities:** Participate in company events, meetups, and team-building exercises to build professional connections.");
    drawListItem(doc, "•", "**Team Collaboration:** Engage with various teams and departments to understand how cross-functional collaboration leads to the success of a company.");
    doc.moveDown(0.45);

    // Section 5
    drawSectionHeading(doc, "5", "Terms and Conditions");

    drawSubHeading(doc, "Working Hours");
    drawFormattedText(doc, `The standard working hours for the ${isIntern ? "internship" : "role"} will be **${user.workSchedule || "11 AM – 8 PM (Mon–Sat)"}**, with appropriate breaks. You may be required to work additional hours depending on project needs, but this will be communicated well in advance.`, { width: pageWidth, moveDown: 0.4 });

    drawSubHeading(doc, "Performance Reviews");
    drawFormattedText(doc, `Throughout your ${isIntern ? "internship" : "employment"}, you will be subject to regular performance reviews. These reviews are designed to assess your progress and provide feedback for improvement. Based on these evaluations, you will be given opportunities to work on more complex projects or explore different areas of interest within the company.`, { width: pageWidth, moveDown: 0.4 });

    drawSubHeading(doc, "Confidentiality Agreement");
    drawFormattedText(doc, `During your association with Rhinon Tech, you may have access to sensitive and proprietary information. It is expected that you maintain confidentiality and not disclose any company-related information to external parties. A separate Non-Disclosure Agreement (NDA) will be provided to you on the first day of your ${isIntern ? "internship" : "employment"}.`, { width: pageWidth, moveDown: 0.4 });

    drawSubHeading(doc, "Intellectual Property");
    drawFormattedText(doc, `Any work, project, or intellectual property developed by you during the ${isIntern ? "internship" : "employment"} remains the sole property of **Rhinon Tech**. You will be expected to transfer all rights of any code, design, or product developed during your tenure to the company.`, { width: pageWidth, moveDown: 0.6 });

    // Section 6
    drawSectionHeading(doc, "6", "Termination Clause");
    drawFormattedText(doc, `While we expect you to successfully complete your tenure, both the ${isIntern ? "intern" : "employee"} and Rhinon Tech have the right to terminate the agreement under the following conditions:`, { width: pageWidth, moveDown: 0.35 });

    drawListItem(doc, "•", "**Voluntary Termination:** Either party may terminate the agreement with **1 Month Prior Notice**. A written notice is required in case you decide to discontinue.");
    drawListItem(doc, "•", "**Involuntary Termination:** The company reserves the right to terminate immediately if any of the following occurs:");

    const clauses = [
      "Violation of company policies or non-compliance with the employment agreement.",
      "Misconduct, dishonesty, or inappropriate behavior within the workplace.",
      "Poor performance reviews with no sign of improvement for 2 consecutive months.",
      "Intentionally or negligently disclosing any Confidential Information to any unauthorized person or entity.",
      "Intentionally or negligently misusing or misappropriating any Confidential Information.",
      "Failure to comply with the Company's security policies or procedures regarding Confidential Information.",
      "Failure to return all company property and settle any pending documents upon request."
    ];

    clauses.forEach((c, i) => {
      drawListItem(doc, `${String.fromCharCode(97 + i)}.`, c, { indent: 13, markerWidth: 14, lineGap: 2, moveDown: 0.1 });
    });
    doc.moveDown(0.5);

    // Section 7
    drawSectionHeading(doc, "7", isIntern ? "Post-Internship Review and Opportunities" : "Performance Appraisals and Opportunities");

    drawFormattedText(doc, `At the conclusion of your ${isIntern ? "internship" : "annual cycle"}, we will conduct a **formal review of your performance**. This review will evaluate your contributions, professionalism, teamwork, and learning agility.`, { width: pageWidth, moveDown: 0.35 });

    doc.font("Helvetica-Bold").text(`${isIntern ? "Post-Internship Outcomes" : "Growth Outcomes"}:`, { lineGap: 2 });
    doc.font("Helvetica");
    if (isIntern) {
      drawListItem(doc, "1.", "**Certificate of Completion:** Issued if you have met the internship objectives satisfactorily.", { markerWidth: 14 });
      drawListItem(doc, "2.", "**Experience Letter:** Provided to highlight your key contributions and the skills you have developed.", { markerWidth: 14 });
      drawListItem(doc, "3.", "**Full-Time Employment Opportunity:** Outstanding interns may be offered a full-time role with Rhinon Tech in a relevant department, subject to the availability of openings.", { markerWidth: 14 });
    } else {
      drawListItem(doc, "1.", "**Experience Certification:** Standard certificate referencing your duration, skills, and projects.", { markerWidth: 14 });
      drawListItem(doc, "2.", "**Career Advancement:** Eligible for promotion, leadership tracks, and direct bonuses based on metrics.", { markerWidth: 14 });
    }
    doc.moveDown(0.3);

    drawFormattedText(doc, `We strongly believe in recognizing talent, and those who demonstrate exceptional performance and alignment with our company culture will be considered for permanent leadership positions with Rhinon Tech.`, { width: pageWidth, moveDown: 0.6 });

    // Section 8
    drawSectionHeading(doc, "8", "Code of Conduct");
    drawListItem(doc, "1.", "**Professionalism:** Always maintain a professional demeanor in all interactions with colleagues and clients.", { markerWidth: 14 });
    drawListItem(doc, "2.", "**Punctuality:** Be punctual and accountable for the working hours agreed upon.", { markerWidth: 14 });
    drawListItem(doc, "3.", "**Workplace Ethics:** Follow all company policies, including those related to cybersecurity, workplace behavior, and data protection.", { markerWidth: 14 });
    drawListItem(doc, "4.", "**Teamwork:** Collaborate effectively with other team members and contribute positively to the company's culture.", { markerWidth: 14 });
    doc.moveDown(0.3);
    doc.text("Failure to comply with these guidelines may result in termination or other disciplinary actions.", { lineGap: 2 });
    doc.moveDown(0.6);

    // Section 9 — kept together with the sign-off below it (a closing section
    // split from its "Best regards" reads worse than starting a fresh page).
    // Generous bound: heading + both paragraphs + sign-off block, worst case.
    ensureRoom(doc, 290);
    drawSectionHeading(doc, "9", "Next Steps and Acceptance");
    const acceptD = new Date(startD.getTime() + 7 * 24 * 60 * 60 * 1000);
    const acceptOrd = getOrdinal(acceptD.getDate());
    const acceptStr = `${acceptD.getDate()}${acceptOrd} ${acceptD.toLocaleDateString("en-US", { month: "long" })}, ${acceptD.getFullYear()}`;

    drawFormattedText(doc, `To confirm your acceptance of this offer, please sign and return a copy of this letter by **${acceptStr}**. We are excited to have you as part of the Rhinon Tech team and look forward to your contributions.`, { width: pageWidth, moveDown: 0.35 });
    doc.text("If you have any questions or require further clarification, feel free to reach out to the HR Department at info@rhinontech.com", { lineGap: 2 });
    doc.moveDown(0.75);

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

type NdaBlock =
  | { kind: "section"; text: string }
  | { kind: "clause"; num: string; text: string }
  | { kind: "sub"; label: string; text: string }
  | { kind: "subsub"; label: string; text: string };

// Full NDA body — transcribed from the company-provided template, with the
// following deliberate changes from the source: "Contractor"/"Client"/"Retainer"
// (freelance-agreement terminology) normalized to "Employee"/"Company"/"Employment"
// throughout; the two non-competition date clauses (12, 13) changed from a fixed
// calendar date to a relative period so they stay correct regardless of joining
// date; the source's "Page X of 10" pagination markers and "LawDepot.com"
// attribution footer dropped (both are artifacts of the template's origin, not
// agreement content); the closing witness/seal block simplified to a two-column
// signature layout to match this app's e-signing flow.
function ndaBody(employeeName: string, employeeAddress: string): NdaBlock[] {
  return [
    { kind: "section", text: "Confidential Information" },
    { kind: "clause", num: "1", text: `All written and oral information and materials disclosed or provided by the Company to the Employee under this Agreement constitute Confidential Information regardless of whether such information was provided before or after the date of this Agreement or how it was provided to the Employee.` },
    { kind: "clause", num: "2", text: `The Employee acknowledges that in any position the Employee may hold, in and as a result of the Employee's employment by the Company, the Employee will, or may, be making use of, acquiring or adding to information about certain matters and things which are confidential to the Company and which information is the exclusive property of the Company.` },
    { kind: "clause", num: "3", text: `'Confidential Information' means all data and information relating to the business and management of the Company, including but not limited to, the following:` },
    { kind: "sub", label: "a.", text: `'Business Operations' which includes internal personnel and financial information of the Company, vendor names and other vendor information (including vendor characteristics, services and agreements), purchasing and internal cost information, internal services and operational manuals, external business contacts including those stored on social media accounts or other similar platforms or databases operated by the Company, and the manner and methods of conducting the Company's business;` },
    { kind: "sub", label: "b.", text: `'Customer Information' which includes names of customers of the Company, their representatives, all customer contact information, contracts and their contents and parties, customer services, data provided by customers and the type, quantity and specifications of products and services purchased, leased, licensed or received by customers of the Company;` },
    { kind: "sub", label: "c.", text: `'Intellectual Property' which includes information relating to the Company's proprietary rights prior to any public disclosure of such information, including but not limited to the nature of the proprietary rights, production data, technical and engineering data, technical concepts, test data and test results, simulation results, the status and details of research and development of products and services, and information regarding acquiring, protecting, enforcing and licensing proprietary rights (including patents, copyrights and trade secrets);` },
    { kind: "sub", label: "d.", text: `'Service Information' which includes all data and information relating to the services provided by the Company, including but not limited to, plans, schedules, manpower, inspection, and training information;` },
    { kind: "sub", label: "e.", text: `'Product Information' which includes all specifications for products of the Company as well as work product resulting from or related to work or projects performed or to be performed for the Company or for clients of the Company, of any type or form in any stage of actual or anticipated research and development;` },
    { kind: "sub", label: "f.", text: `'Production Processes' which includes processes used in the creation, production and manufacturing of the work product of the Company, including but not limited to, formulas, patterns, moulds, models, methods, techniques, specifications, processes, procedures, equipment, devices, programs, and designs;` },
    { kind: "sub", label: "g.", text: `'Accounting Information' which includes, without limitation, all financial statements, annual reports, balance sheets, company asset information, company liability information, revenue and expense reporting, profit and loss reporting, cash flow reporting, accounts receivable, accounts payable, inventory reporting, purchasing information and payroll information of the Company;` },
    { kind: "sub", label: "h.", text: `'Marketing and Development Information' which includes marketing and development plans of the Company, price and cost data, price and fee amounts, pricing and billing policies, quoting procedures, marketing techniques and methods of obtaining business, forecasts and forecast assumptions and volumes, and future plans and potential strategies of the Company which have been or are being discussed;` },
    { kind: "sub", label: "i.", text: `'Computer Technology' which includes all scientific and technical information or material of the Company, pertaining to any machine, appliance or process, including but not limited to, specifications, proposals, models, designs, formulas, test results and reports, analyses, simulation results, tables of operating conditions, materials, components, industrial skills, operating and testing procedures, shop practices, know how and show-how;` },
    { kind: "sub", label: "j.", text: `'Proprietary Computer Code' which includes all sets of statements, instructions or programs of the Company, whether in human readable or machine readable form, that are expressed, fixed, embodied or stored in any manner and that can be used directly or indirectly in a computer ('Computer Programs'); any report format, design or drawing created or produced by such Computer Programs; and all documentation, design specifications and charts, and operating procedures which support the Computer Programs; and` },
    { kind: "sub", label: "k.", text: `Confidential Information will also include any information that has been disclosed by a third party to the Company and is protected by a non-disclosure agreement entered into between the third party and the Company.` },
    { kind: "clause", num: "4", text: `Confidential Information will not include the following information:` },
    { kind: "sub", label: "a.", text: `Information that is generally known in the industry of the Company;` },
    { kind: "sub", label: "b.", text: `Information that is now or subsequently becomes generally available to the public through no wrongful act of the Employee;` },
    { kind: "sub", label: "c.", text: `Information rightly in the possession of the Employee prior to the disclosure to the Employee by the Company;` },
    { kind: "sub", label: "d.", text: `Information that is independently created by the Employee without direct or indirect use of the Confidential Information; or` },
    { kind: "sub", label: "e.", text: `Information that the Employee rightfully obtains from a third party who has the right to transfer or disclose it.` },

    { kind: "section", text: "Obligations of Non-Disclosure" },
    { kind: "clause", num: "5", text: `Except as otherwise provided in this Agreement, the Employee must not disclose the Confidential Information.` },
    { kind: "clause", num: "6", text: `Except as otherwise provided in this Agreement, the Confidential Information will remain the exclusive property of the Company and will only be used by the Employee for the Permitted Purpose. The Employee will not use the Confidential Information for any purpose that might be directly or indirectly detrimental to the Company or any associated affiliates or subsidiaries.` },
    { kind: "clause", num: "7", text: `The obligations to ensure and prevent the disclosure of the Confidential Information imposed on the Employee in this Agreement and any obligations to provide notice under this Agreement will survive the expiration or termination, as the case may be, of this Agreement and those obligations will last indefinitely.` },
    { kind: "clause", num: "8", text: `The Employee may disclose any of the Confidential Information:` },
    { kind: "sub", label: "a.", text: `to such employees, agents, representatives and advisors of the Employee that have a need to know for the Permitted Purpose provided that:` },
    { kind: "subsub", label: "i.", text: `the Employee has informed such personnel of the confidential nature of the Confidential Information;` },
    { kind: "subsub", label: "ii.", text: `such personnel agree to be legally bound to the same burdens of non-disclosure and non-use as the Employee;` },
    { kind: "subsub", label: "iii.", text: `the Employee agrees to take all necessary steps to ensure that the terms of this Agreement are not violated by such personnel; and` },
    { kind: "subsub", label: "iv.", text: `the Employee agrees to be responsible for and indemnify the Company for any breach of this Agreement by their personnel.` },
    { kind: "sub", label: "b.", text: `to a third party where the Company has consented in writing to such disclosure; and` },
    { kind: "sub", label: "c.", text: `to the extent required by law or by the request or requirement of any judicial, legislative, administrative or other governmental body.` },

    { kind: "section", text: "Avoiding Conflict of Opportunities" },
    { kind: "clause", num: "9", text: `It is understood and agreed that any business opportunity relating to or similar to the Company's current or anticipated business opportunities coming to the attention of the Employee during the Employee's employment is an opportunity belonging to the Company. Accordingly, the Employee will advise the Company of the opportunity and cannot pursue the opportunity, directly or indirectly, without the written consent of the Company.` },
    { kind: "clause", num: "10", text: `Without the written consent of the Company, the Employee further agrees not to:` },
    { kind: "sub", label: "a.", text: `solely or jointly with others undertake or join any planning for or organisation of any business activity competitive with the current or anticipated business activities of the Company; and` },
    { kind: "sub", label: "b.", text: `directly or indirectly, engage or participate in any other business activities which the Company, in its reasonable discretion, determines to be in conflict with the best interests of the Company.` },

    { kind: "section", text: "Non-Solicitation" },
    { kind: "clause", num: "11", text: `Any attempt on the part of the Employee to induce others to leave the Company's employ, or any effort by the Employee to interfere with the Company's relationship with its other employees, would be harmful and damaging to the Company. The Employee agrees that from the date of this Agreement for a period of two years after the end of the Agreement, the Employee will not in any way, directly or indirectly:` },
    { kind: "sub", label: "a.", text: `induce or attempt to induce any employee of the Company to quit their employment with the Company;` },
    { kind: "sub", label: "b.", text: `otherwise interfere with or disrupt the Company's relationship with its employees;` },
    { kind: "sub", label: "c.", text: `discuss employment opportunities or provide information about competitive employment to any of the Company's employees; or` },
    { kind: "sub", label: "d.", text: `solicit, entice, or hire away any employee of the Company. This obligation will be limited in scope to those persons that were employees of the Company at the same time that the Employee was employed by the Company.` },

    { kind: "section", text: "Non-Competition" },
    { kind: "clause", num: "12", text: `Other than through employment with a bona-fide independent party, or with the express written consent of the Company, which will not be unreasonably withheld, the Employee will not, for a period of 2 years following termination of the Employment, be directly or indirectly involved with a business which is in direct competition with the particular business line of the Company that the Employee was working during any time in the last year of employment with the Company.` },
    { kind: "clause", num: "13", text: `For a period of 2 years following termination of the Employment, the Employee will not divert or attempt to divert from the Company any business the Company had enjoyed, solicited, or attempted to solicit, from its customers, prior to termination or expiration, as the case may be, of the Employment.` },

    { kind: "section", text: "Ownership and Title" },
    { kind: "clause", num: "14", text: `The Employee acknowledges and agrees that all rights, title and interest in any Confidential Information will remain the exclusive property of the Company. Accordingly, the Employee specifically agrees and acknowledges that the Employee will have no interest in the Confidential Information, including, without limitation, no interest in know-how, copyright, trade mark or trade names, notwithstanding the fact that the Employee may have created or contributed to the creation of that Confidential Information.` },
    { kind: "clause", num: "15", text: `The Employee does hereby waive any moral rights that the Employee may have with respect to the Confidential Information.` },
    { kind: "clause", num: "16", text: `The Confidential Information will not include anything developed or produced by the Employee during the term of this Agreement, including but not limited to intellectual property, process, design, development, creation, research, invention, know-how, trade name, trade mark or copyright that:` },
    { kind: "sub", label: "a.", text: `was developed without the use of any equipment, supplies, facility or Confidential Information of the Company;` },
    { kind: "sub", label: "b.", text: `was developed entirely on the Employee's own time;` },
    { kind: "sub", label: "c.", text: `does not relate to the actual business or reasonably anticipated business of the Company;` },
    { kind: "sub", label: "d.", text: `does not relate to the actual or demonstrably anticipated processes, research, or development of the Company; and` },
    { kind: "sub", label: "e.", text: `does not result from any work performed by the Employee for the Company.` },
    { kind: "clause", num: "17", text: `The Employee agrees to immediately disclose to the Company all Confidential Information developed in whole or in part by the Employee during the term of the Employment and to assign to the Company any right, title or interest the Employee may have in the Confidential Information. The Employee agrees to execute any instruments and to do all other things reasonably requested by the Company (both during and after the term of the Employment) in order to vest more fully in the Company all ownership rights in those items transferred by the Employee to the Company.` },

    { kind: "section", text: "Remedies" },
    { kind: "clause", num: "18", text: `The Employee agrees and acknowledges that the Confidential Information is of a proprietary and confidential nature and that any disclosure of the Confidential Information to a third party in breach of this Agreement cannot be reasonably or adequately compensated for in money damages and would cause irreparable injury to the Company. Accordingly, the Employee agrees that the Company is entitled to, in addition to all other rights and remedies available to it at law or in equity, an injunction restraining the Employee and any agents of the Employee, from directly or indirectly committing or engaging in any act restricted by this Agreement in relation to the Confidential Information.` },

    { kind: "section", text: "Return of Confidential Information" },
    { kind: "clause", num: "19", text: `The Employee agrees that, upon request of the Company, or in the event that the Employee ceases to require use of the Confidential Information, or upon expiration or termination of this Agreement, or the expiration or termination of the Employment, the Employee will turn over to the Company all documents, disks or other computer media, or other material in the possession or control of the Employee that:` },
    { kind: "sub", label: "a.", text: `may contain or be derived from ideas, concepts, creations, or trade secrets and other proprietary and Confidential Information as defined in this Agreement; or` },
    { kind: "sub", label: "b.", text: `is connected with or derived from the Employee's services to the Company.` },

    { kind: "section", text: "Notices" },
    { kind: "clause", num: "20", text: `In the event that the Employee is required in a civil, criminal or regulatory proceeding to disclose any part of the Confidential Information, the Employee will give to the Company prompt written notice of such request so the Company may seek an appropriate remedy or alternatively to waive the Employee's compliance with the provisions of this Agreement in regards to the request.` },
    { kind: "clause", num: "21", text: `If the Employee loses or makes unauthorised disclosure of any of the Confidential Information, the Employee will immediately notify the Company and take all reasonable steps necessary to retrieve the lost or improperly disclosed Confidential Information.` },
    { kind: "clause", num: "22", text: `Any notices or delivery required in this Agreement will be deemed completed when hand delivered, delivered by agent, or seven days after being placed in the post, postage prepaid, to the parties at the addresses contained in this Agreement or as the parties may later designate in writing.` },
    { kind: "clause", num: "23", text: `The addresses for any notice to be delivered to any of the parties to this Agreement are as follows:` },
    { kind: "sub", label: "a.", text: `Name: Rhinon Tech, Address: Hanuman Nagar 1st Lane, Medical Bank Colony, Berhampur, Ganjam – 760004` },
    { kind: "sub", label: "b.", text: `Name: ${employeeName}, Address: ${employeeAddress}` },

    { kind: "section", text: "Representations" },
    { kind: "clause", num: "24", text: `In providing the Confidential Information, the Company makes no representations, either expressly or impliedly as to its adequacy, sufficiency, completeness, correctness or its lack of defect of any kind, including any patent or trade mark infringement that may result from the use of such information.` },

    { kind: "section", text: "Termination" },
    { kind: "clause", num: "25", text: `This Agreement will automatically terminate on the date that the Employee's employment with the Company terminates or expires, as the case may be. Except as otherwise provided in this Agreement, all rights and obligations under this Agreement will terminate at that time.` },

    { kind: "section", text: "Assignment" },
    { kind: "clause", num: "26", text: `Except where a party has changed its corporate name or merged with another corporation, this Agreement may not be assigned or otherwise transferred by either party in whole or part without the prior written consent of the other party to this Agreement.` },

    { kind: "section", text: "Amendments" },
    { kind: "clause", num: "27", text: `This Agreement may only be amended or modified by a written instrument executed by both the Company and the Employee.` },

    { kind: "section", text: "Governing Law" },
    { kind: "clause", num: "28", text: `This Agreement will be construed in accordance with and governed by the laws of Odisha.` },

    { kind: "section", text: "General Provisions" },
    { kind: "clause", num: "29", text: `Time is of the essence in this Agreement.` },
    { kind: "clause", num: "30", text: `This Agreement may be executed in counterpart.` },
    { kind: "clause", num: "31", text: `Headings are inserted for the convenience of the parties only and are not to be considered when interpreting this Agreement. Words in the singular mean and include the plural and vice versa. Words in the masculine mean and include the feminine and vice versa.` },
    { kind: "clause", num: "32", text: `The clauses, paragraphs, and subparagraphs contained in this Agreement are intended to be read and construed independently of each other. If any part of this Agreement is held to be invalid, this invalidity will not affect the operation of any other part of this Agreement.` },
    { kind: "clause", num: "33", text: `The Employee is liable for all costs, expenses and expenditures including, and without limitation, the complete legal costs incurred by the Company in enforcing this Agreement as a result of any default of this Agreement by the Employee.` },
    { kind: "clause", num: "34", text: `The Company and the Employee acknowledge that this Agreement is reasonable, valid and enforceable. However, if a court of competent jurisdiction finds any of the provisions of this Agreement to be too broad to be enforceable, it is the intention of the Company and the Employee that such provision be reduced in scope by the court only to the extent deemed necessary by that court to render the provision reasonable and enforceable, bearing in mind that it is the intention of the Employee to give the Company the broadest possible protection against disclosure of the Confidential Information.` },
    { kind: "clause", num: "35", text: `No failure or delay by the Company in exercising any power, right or privilege provided in this Agreement will operate as a waiver, nor will any single or partial exercise of such rights, powers or privileges preclude any further exercise of them or the exercise of any other right, power or privilege provided in this Agreement.` },
    { kind: "clause", num: "36", text: `This Agreement will inure to the benefit of and be binding upon the respective heirs, executors, administrators, successors and assigns, as the case may be, of the Company and the Employee.` },
    { kind: "clause", num: "37", text: `This Agreement constitutes the entire agreement between the parties and there are no further items or provisions, either oral or otherwise.` },
  ];
}

export async function generateNdaPdf(user: User, signature?: LetterSignature): Promise<Buffer> {
  const signatureBuffer = await getObjectBuffer(SIGNATURE_KEY).catch(() => null);

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

    doc.font("Helvetica-Bold").text("BACKGROUND:", { lineGap: 2 });
    doc.font("Helvetica");
    drawListItem(doc, "1.", `The Employee is employed by the Company for the position of: **${user.roleTitle || "their role"}**. In addition to this responsibility or position (the "Employment"), this Agreement also covers any position or responsibility now or later held with the Company.`, { markerWidth: 14, lineGap: 2, moveDown: 0.2 });
    drawListItem(doc, "2.", `The Employee will receive from the Company, or develop on behalf of the Company, Confidential Information as a result of the Employment (the "Permitted Purpose").`, { markerWidth: 14, lineGap: 2, moveDown: 0.4 });

    drawFormattedText(doc, `IN CONSIDERATION OF and as a condition of the Company employing the Employee and the Company providing the Confidential Information to the Employee, in addition to other valuable consideration, the receipt and sufficiency of which consideration is hereby acknowledged, the parties to this Agreement agree as follows:`, { width: pageWidth, moveDown: 0.5 });

    // --- Main body: 37 clauses across named sections. Clause numbers and the
    // a./b./c. sub-items render as hanging-indent columns so wrapped lines stay
    // aligned under the text (see drawListItem).
    for (const block of ndaBody(employeeName, loc)) {
      if (block.kind === "section") {
        ensureRoom(doc, 56); // never orphan a section name at the page foot
        doc.fillColor("#005085").font("Helvetica-Bold").fontSize(11.5).text(block.text, { lineGap: 2 });
        doc.fillColor("#222222").font("Helvetica").fontSize(10);
        doc.moveDown(0.15);
      } else if (block.kind === "clause") {
        drawListItem(doc, `${block.num}.`, block.text, { markerWidth: 18, lineGap: 2, moveDown: 0.15 });
      } else if (block.kind === "sub") {
        drawListItem(doc, block.label, block.text, { indent: 18, markerWidth: 14, lineGap: 2, moveDown: 0.1 });
      } else {
        drawListItem(doc, block.label, block.text, { indent: 32, markerWidth: 14, lineGap: 2, moveDown: 0.1 });
      }
    }
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

