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
