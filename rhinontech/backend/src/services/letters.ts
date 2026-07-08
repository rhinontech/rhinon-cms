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
  doc.y = 85;
}

function drawSectionHeading(doc: PDFKit.PDFDocument, num: string, text: string) {
  doc.fillColor("#005085").font("Helvetica-Bold").fontSize(10.5).text(`${num}. ${text}`, { lineGap: 4 });
  doc.fillColor("#222222").font("Helvetica").fontSize(9.5);
  doc.moveDown(0.4);
}

function drawFormattedText(doc: PDFKit.PDFDocument, text: string, options: any = {}) {
  const parts = text.split("**");
  const x = options.x || doc.x;
  const y = options.y || doc.y;
  const lineGap = options.lineGap || 3;
  const width = options.width || (doc.page.width - 120);

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

export async function generateOfferLetterPdf(user: User): Promise<Buffer> {
  const signatureBuffer = await getObjectBuffer(SIGNATURE_KEY).catch(() => null);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margins: { top: 100, bottom: 60, left: 60, right: 60 } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 120;
    const isIntern = user.employmentType?.toLowerCase() === "internship";

    // --- PAGE 1 ---
    drawHeader(doc, logoBuffer);
    
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#005085").text("PRIVATE & CONFIDENTIAL", { align: "center" });
    doc.moveDown(1.5);

    // Date
    const today = new Date();
    const ordinalDay = getOrdinal(today.getDate());
    const dateStr = `${today.getDate()}${ordinalDay} ${today.toLocaleDateString("en-US", { month: "long" })}, ${today.getFullYear()}`;
    
    doc.fillColor("#222222").font("Helvetica").fontSize(9.5);
    doc.text(dateStr, { lineGap: 2 });
    doc.font("Helvetica-Bold").text(user.legalName || user.fullName, { lineGap: 2 });
    doc.font("Helvetica").text(user.workLocation || "Bengaluru, India", { lineGap: 2 });
    doc.moveDown(1.5);

    doc.text(`Dear ${user.fullName.split(" ")[0]},`);
    doc.moveDown(1);

    // Section 1
    drawSectionHeading(doc, "1", "Introduction to Rhinon Tech");
    drawFormattedText(doc, `We are thrilled to offer you the opportunity to ${isIntern ? "intern" : "work"} with **Rhinon Tech**, a cutting-edge technology company dedicated to pushing the boundaries of innovation and excellence. Since our inception, Rhinon Tech has been at the forefront of developing scalable solutions and empowering industries with the tools to grow in a highly competitive marketplace.`, { width: pageWidth, moveDown: 0.75 });
    drawFormattedText(doc, `As a company that values creativity, innovation, and a passion for technology, we believe in providing our ${isIntern ? "interns" : "employees"} with the best learning experience and preparing them for future roles in the industry. Through this ${isIntern ? "internship" : "employment"}, you will be involved in projects that contribute directly to Rhinon Tech's mission.`, { width: pageWidth, moveDown: 1.2 });

    // Section 2
    const startD = user.joiningDate ? new Date(user.joiningDate) : new Date();
    const endD = new Date(startD.getFullYear(), startD.getMonth() + 6, startD.getDate());
    
    const startOrd = getOrdinal(startD.getDate());
    const startStr = `${startD.getDate()}${startOrd} ${startD.toLocaleDateString("en-US", { month: "long" })}, ${startD.getFullYear()}`;
    
    const endOrd = getOrdinal(endD.getDate());
    const endStr = `${endD.getDate()}${endOrd} ${endD.toLocaleDateString("en-US", { month: "long" })}, ${endD.getFullYear()}`;
    
    const fmtStartShort = startD.toLocaleDateString("en-GB").replace(/\//g, "-");
    const fmtEndShort = endD.toLocaleDateString("en-GB").replace(/\//g, "-");
    
    drawSectionHeading(doc, "2", isIntern ? "Offer of Internship" : "Offer of Employment");
    drawFormattedText(doc, `We are pleased to offer you the position of **${user.roleTitle || (isIntern ? "NextJs Developer Intern" : "NextJs Developer")}** ${isIntern ? `for a period of **6 months** starting from **${fmtStartShort}** to **${fmtEndShort}**` : `starting from **${startStr}**`}. This position is an important step toward building your professional experience, and we look forward to seeing your contributions in real-world projects.`, { width: pageWidth, moveDown: 0.75 });
    drawFormattedText(doc, `This role will help you gain skills in Product Development and AI with talented professionals and get exposure to cutting-edge technologies.`, { width: pageWidth, moveDown: 1.2 });

    // Section 3
    drawSectionHeading(doc, "3", isIntern ? "Internship Position Details" : "Employment Position Details");
    
    doc.font("Helvetica").text("• ", { continued: true }).font("Helvetica-Bold").text("Designation: ", { continued: true }).font("Helvetica").text(user.roleTitle || "NextJs Developer", { lineGap: 3 });
    doc.font("Helvetica").text("• ", { continued: true }).font("Helvetica-Bold").text("Location: ", { continued: true }).font("Helvetica").text(user.workLocation || "Bengaluru (Remote)", { lineGap: 3 });
    if (isIntern) {
      doc.font("Helvetica").text("• ", { continued: true }).font("Helvetica-Bold").text("Internship Duration: ", { continued: true }).font("Helvetica").text("6 months", { lineGap: 3 });
    } else {
      doc.font("Helvetica").text("• ", { continued: true }).font("Helvetica-Bold").text("Employment Type: ", { continued: true }).font("Helvetica").text("Full-Time / Permanent", { lineGap: 3 });
    }
    doc.font("Helvetica").text("• ", { continued: true }).font("Helvetica-Bold").text("Working Hours: ", { continued: true }).font("Helvetica").text(isIntern ? "48 hours per week" : "40 hours per week", { lineGap: 3 });
    doc.moveDown(1.2);

    // Section 4 header at bottom of Page 1
    drawSectionHeading(doc, "4", "Compensation and Benefits");

    // --- PAGE 2 ---
    doc.addPage();
    drawHeader(doc, logoBuffer);

    const monthlyStipendVal = user.annualCompensation ? Math.round(Number(user.annualCompensation) / 12) : 5000;
    
    if (isIntern) {
      drawFormattedText(doc, `During your internship period, this is a paid internship for **${monthlyStipendVal}/- per month**. After three months, there will be a review meeting to assess your performance, and based on this review, we will decide on future opportunities and compensation.`, { width: pageWidth, moveDown: 1 });
    } else {
      const ctcVal = user.annualCompensation ? money(user.annualCompensation) : "As discussed";
      drawFormattedText(doc, `Your starting compensation package includes an annual CTC of **${ctcVal}** paid on a **monthly basis** in accordance with our standard payroll cycle. Your compensation will be subject to annual performance reviews.`, { width: pageWidth, moveDown: 1 });
    }

    doc.text(`You will enjoy the following benefits as ${isIntern ? "an intern" : "an employee"} at Rhinon Tech:`);
    doc.moveDown(0.6);
    
    doc.font("Helvetica").text("• ", { continued: true }).font("Helvetica-Bold").text("Mentorship: ", { continued: true }).font("Helvetica").text(`You will be assigned a mentor who will provide guidance throughout your ${isIntern ? "internship" : "tenure"}.`, { lineGap: 3 });
    doc.font("Helvetica").text("• ", { continued: true }).font("Helvetica-Bold").text("Workshops and Training: ", { continued: true }).font("Helvetica").text("Access to internal training programs and workshops that align with your field of work.", { lineGap: 3 });
    doc.font("Helvetica").text("• ", { continued: true }).font("Helvetica-Bold").text("Networking Opportunities: ", { continued: true }).font("Helvetica").text("Participate in company events, meetups, and team-building exercises to build professional connections.", { lineGap: 3 });
    doc.font("Helvetica").text("• ", { continued: true }).font("Helvetica-Bold").text("Team Collaboration: ", { continued: true }).font("Helvetica").text("Engage with various teams and departments to understand how cross-functional collaboration leads to the success of a company.", { lineGap: 3 });
    doc.moveDown(1.2);

    // Section 5
    drawSectionHeading(doc, "5", "Terms and Conditions");
    
    doc.font("Helvetica-Bold").fontSize(10).text("Working Hours", { lineGap: 2 });
    doc.font("Helvetica").fontSize(9.5);
    drawFormattedText(doc, `The standard working hours for the ${isIntern ? "internship" : "role"} will be **11 AM to 8 PM, Monday to Saturday** (with appropriate breaks). You may be required to work additional hours depending on project needs, but this will be communicated well in advance.`, { width: pageWidth, moveDown: 0.8 });
    
    doc.font("Helvetica-Bold").fontSize(10).text("Performance Reviews", { lineGap: 2 });
    doc.font("Helvetica").fontSize(9.5);
    drawFormattedText(doc, `Throughout your ${isIntern ? "internship" : "employment"}, you will be subject to regular performance reviews. These reviews are designed to assess your progress and provide feedback for improvement. Based on these evaluations, you will be given opportunities to work on more complex projects or explore different areas of interest within the company.`, { width: pageWidth, moveDown: 0.8 });

    doc.font("Helvetica-Bold").fontSize(10).text("Confidentiality Agreement", { lineGap: 2 });
    doc.font("Helvetica").fontSize(9.5);
    drawFormattedText(doc, `During your association with Rhinon Tech, you may have access to sensitive and proprietary information. It is expected that you maintain confidentiality and not disclose any company-related information to external parties. A separate Non-Disclosure Agreement (NDA) will be provided to you on the first day of your ${isIntern ? "internship" : "employment"}.`, { width: pageWidth, moveDown: 0.8 });

    // --- PAGE 3 ---
    doc.addPage();
    drawHeader(doc, logoBuffer);

    doc.font("Helvetica-Bold").fontSize(10).text("Intellectual Property", { lineGap: 2 });
    doc.font("Helvetica").fontSize(9.5);
    drawFormattedText(doc, `Any work, project, or intellectual property developed by you during the ${isIntern ? "internship" : "employment"} remains the sole property of **Rhinon Tech**. You will be expected to transfer all rights of any code, design, or product developed during your tenure to the company.`, { width: pageWidth, moveDown: 1.2 });

    // Section 6
    drawSectionHeading(doc, "6", "Termination Clause");
    drawFormattedText(doc, `While we expect you to successfully complete your tenure, both the ${isIntern ? "intern" : "employee"} and Rhinon Tech have the right to terminate the agreement under the following conditions:`, { width: pageWidth, moveDown: 0.6 });
    
    doc.font("Helvetica").text("• ", { continued: true }).font("Helvetica-Bold").text("Voluntary Termination: ", { continued: true }).font("Helvetica").text(`Either party may terminate the agreement with **1 Month Prior Notice**. A written notice is required in case you decide to discontinue.`, { lineGap: 3 });
    doc.font("Helvetica").text("• ", { continued: true }).font("Helvetica-Bold").text("Involuntary Termination: ", { continued: true }).font("Helvetica").text("The company reserves the right to terminate immediately if any of the following occurs:", { lineGap: 3 });
    
    const clauses = [
      "a. Violation of company policies or non-compliance with the employment agreement.",
      "b. Misconduct, dishonesty, or inappropriate behavior within the workplace.",
      "c. Poor performance reviews with no sign of improvement for 2 consecutive months.",
      "d. Intentionally or negligently disclosing any Confidential Information to any unauthorized person or entity.",
      "e. Intentionally or negligently misusing or misappropriating any Confidential Information.",
      "f. Failure to comply with the Company's security policies or procedures regarding Confidential Information.",
      "g. Failure to return all company property and settle any pending documents upon request."
    ];
    
    clauses.forEach(c => {
      doc.text(`    ${c}`, { lineGap: 2 });
    });
    doc.moveDown(1.2);

    // Section 7
    drawSectionHeading(doc, "7", isIntern ? "Post-Internship Review and Opportunities" : "Performance Appraisals and Opportunities");

    // --- PAGE 4 ---
    doc.addPage();
    drawHeader(doc, logoBuffer);

    drawFormattedText(doc, `At the conclusion of your ${isIntern ? "internship" : "annual cycle"}, we will conduct a **formal review of your performance**. This review will evaluate your contributions, professionalism, teamwork, and learning agility.`, { width: pageWidth, moveDown: 0.6 });
    
    doc.font("Helvetica-Bold").text(`${isIntern ? "Post-Internship Outcomes" : "Growth Outcomes"}:`, { lineGap: 3 });
    if (isIntern) {
      doc.font("Helvetica").text("1. ", { continued: true }).font("Helvetica-Bold").text("Certificate of Completion: ", { continued: true }).font("Helvetica").text("Issued if you have met the internship objectives satisfactorily.", { lineGap: 3 });
      doc.font("Helvetica").text("2. ", { continued: true }).font("Helvetica-Bold").text("Experience Letter: ", { continued: true }).font("Helvetica").text("Provided to highlight your key contributions and the skills you have developed.", { lineGap: 3 });
      doc.font("Helvetica").text("3. ", { continued: true }).font("Helvetica-Bold").text("Full-Time Employment Opportunity: ", { continued: true }).font("Helvetica").text("Outstanding interns may be offered a full-time role with Rhinon Tech in a relevant department, subject to the availability of openings.", { lineGap: 3 });
    } else {
      doc.font("Helvetica").text("1. ", { continued: true }).font("Helvetica-Bold").text("Experience Certification: ", { continued: true }).font("Helvetica").text("Standard certificate referencing your duration, skills, and projects.", { lineGap: 3 });
      doc.font("Helvetica").text("2. ", { continued: true }).font("Helvetica-Bold").text("Career Advancement: ", { continued: true }).font("Helvetica").text("Eligible for promotion, leadership tracks, and direct bonuses based on metrics.", { lineGap: 3 });
    }
    doc.moveDown(0.6);

    drawFormattedText(doc, `We strongly believe in recognizing talent, and those who demonstrate exceptional performance and alignment with our company culture will be considered for permanent leadership positions with Rhinon Tech.`, { width: pageWidth, moveDown: 1.2 });

    // Section 8
    drawSectionHeading(doc, "8", "Code of Conduct");
    doc.font("Helvetica").text("1. ", { continued: true }).font("Helvetica-Bold").text("Professionalism: ", { continued: true }).font("Helvetica").text("Always maintain a professional demeanor in all interactions with colleagues and clients.", { lineGap: 3 });
    doc.font("Helvetica").text("2. ", { continued: true }).font("Helvetica-Bold").text("Punctuality: ", { continued: true }).font("Helvetica").text("Be punctual and accountable for the working hours agreed upon.", { lineGap: 3 });
    doc.font("Helvetica").text("3. ", { continued: true }).font("Helvetica-Bold").text("Workplace Ethics: ", { continued: true }).font("Helvetica").text("Follow all company policies, including those related to cybersecurity, workplace behavior, and data protection.", { lineGap: 3 });
    doc.font("Helvetica").text("4. ", { continued: true }).font("Helvetica-Bold").text("Teamwork: ", { continued: true }).font("Helvetica").text("Collaborate effectively with other team members and contribute positively to the company's culture.", { lineGap: 3 });
    doc.moveDown(0.6);
    doc.text("Failure to comply with these guidelines may result in termination or other disciplinary actions.", { lineGap: 3 });
    doc.moveDown(1.2);

    // Section 9
    drawSectionHeading(doc, "9", "Next Steps and Acceptance");
    const acceptD = new Date(startD.getTime() + 7 * 24 * 60 * 60 * 1000);
    const acceptOrd = getOrdinal(acceptD.getDate());
    const acceptStr = `${acceptD.getDate()}${acceptOrd} ${acceptD.toLocaleDateString("en-US", { month: "long" })}, ${acceptD.getFullYear()}`;
    
    drawFormattedText(doc, `To confirm your acceptance of this offer, please sign and return a copy of this letter by **${acceptStr}**. We are excited to have you as part of the Rhinon Tech team and look forward to your contributions.`, { width: pageWidth, moveDown: 0.6 });
    doc.text("If you have any questions or require further clarification, feel free to reach out to the HR Department at info@rhinontech.com", { lineGap: 3 });
    doc.moveDown(1.5);

    doc.text("Best regards,", { lineGap: 3 });
    doc.moveDown(0.5);
    if (signatureBuffer) {
      doc.image(signatureBuffer, 60, doc.y, { fit: [110, 40] });
      doc.y += 44;
    } else {
      doc.moveDown(2);
    }
    doc.font("Helvetica-Bold").text("Prabhat Patra (Founder)");

    // --- PAGE 5 ---
    doc.addPage();
    drawHeader(doc, logoBuffer);

    doc.font("Helvetica-Bold").fontSize(11).fillColor("#005085").text("Rhinon Tech Acknowledgment of Offer", { align: "center" });
    doc.moveDown(1.5);
    doc.fillColor("#222222").font("Helvetica").fontSize(9.5);

    drawFormattedText(doc, `I, **${user.legalName || user.fullName}**, accept the offer of the **${user.roleTitle || "NextJs Developer"}** position at Rhinon Tech under the terms stated in this letter.`, { width: pageWidth, moveDown: 2 });

    doc.font("Helvetica-Bold").text("Signature: _______________________", { lineGap: 12 });
    doc.font("Helvetica-Bold").text(`Date: __${fmtStartShort}______________________`);

    doc.end();
  });
}

export async function generateNdaPdf(user: User): Promise<Buffer> {
  const signatureBuffer = await getObjectBuffer(SIGNATURE_KEY).catch(() => null);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margins: { top: 100, bottom: 60, left: 60, right: 60 } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 120;
    
    // Header Logo
    drawHeader(doc, logoBuffer);

    doc.font("Helvetica-Bold").fontSize(11).fillColor("#005085").text("NON-DISCLOSURE & CONFIDENTIALITY AGREEMENT", { align: "center" });
    doc.moveDown(1.5);

    const today = new Date();
    const ordinalDay = getOrdinal(today.getDate());
    const dateStr = `${today.getDate()}${ordinalDay} ${today.toLocaleDateString("en-US", { month: "long" })}, ${today.getFullYear()}`;

    doc.fillColor("#222222").font("Helvetica").fontSize(9.5);
    doc.text(`Date: ${dateStr}`, { align: "right" });
    doc.moveDown(1);

    const loc = user.workLocation || "Bengaluru, India";
    doc.text(`This Non-Disclosure and Confidentiality Agreement (the "Agreement") is entered into as of ${dateStr} by and between:`, { align: "justify", lineGap: 3 });
    doc.moveDown(0.8);
    
    doc.font("Helvetica-Bold").text("1. Rhinon Tech", { continued: true }).font("Helvetica").text(` (the "Company"), and`);
    doc.font("Helvetica-Bold").text(`${user.legalName || user.fullName}`, { continued: true }).font("Helvetica").text(` residing at ${loc} (the "Employee").`);
    doc.moveDown(1);

    drawSectionHeading(doc, "1", "Purpose");
    drawFormattedText(doc, `The Company desires to associate with the Employee, during which the Employee will have access to confidential, proprietary, and highly sensitive information of the Company. The Employee agrees to receive and safeguard such information under the terms of this Agreement.`, { width: pageWidth, moveDown: 0.8 });

    drawSectionHeading(doc, "2", "Confidential Information");
    drawFormattedText(doc, `Confidential Information includes all trade secrets, source code, playbooks, databases, client records, research, and financial reports. The Employee agrees to keep all such information strictly confidential and not disclose it to any third party.`, { width: pageWidth, moveDown: 0.8 });

    drawSectionHeading(doc, "3", "Intellectual Property");
    drawFormattedText(doc, `All inventions, systems, software designs, codes, and business methodologies developed by the Employee during their association with the Company remain the exclusive intellectual property of the Company.`, { width: pageWidth, moveDown: 0.8 });

    drawSectionHeading(doc, "4", "Remedies & Jurisdiction");
    drawFormattedText(doc, `Any breach of this agreement shall entitle the Company to seek injunctive relief and damages in accordance with governing laws.`, { width: pageWidth, moveDown: 1.5 });

    // Signatures
    doc.text("IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.");
    doc.moveDown(2);

    const startY = doc.y;
    doc.font("Helvetica").text("For Rhinon Tech,", 60, startY);
    if (signatureBuffer) {
      doc.image(signatureBuffer, 60, startY + 14, { fit: [110, 36] });
    }
    doc.font("Helvetica-Bold").text("Authorized Signatory", 60, startY + 54);

    doc.font("Helvetica").text("Accepted & Agreed By:", doc.page.width / 2 + 20, startY);
    doc.font("Helvetica-Bold").text(`${user.legalName || user.fullName}`, doc.page.width / 2 + 20, startY + 54);
    
    const startD = user.joiningDate ? new Date(user.joiningDate) : new Date();
    const joinedStr = startD.toLocaleDateString("en-GB").replace(/\//g, "-");
    doc.font("Helvetica").fontSize(9).text(`Date: ${joinedStr}`, doc.page.width / 2 + 20, startY + 68);

    doc.end();
  });
}

