// Shared branded HTML email wrapper — used by both the Outreach campaign
// engine and the Automation workflow engine, so every rich-text email (from
// either the campaign composer or a workflow's "Send email" node) renders
// consistently, with the same cross-client list-style fixes and branding.

const BRAND_LOGO_URL = process.env.BRAND_LOGO_URL || "https://www.rhinonlabs.com/Logo_Rhinon_Labs_Light.png";
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || ""; // registered address for compliant footer
export const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5003";
export const FRONTEND_URL = process.env.SITE_URL || process.env.RHINONLABS_URL || process.env.FRONTEND_URL || "https://rhinonlabs.com";

export type EmailTemplateId = "default" | "template1" | "template2" | "template3" | "template4";

export interface EmailTemplateMeta {
  id: EmailTemplateId;
  name: string;
  tagline: string;
  description: string;
}

export const EMAIL_TEMPLATES: EmailTemplateMeta[] = [
  {
    id: "template1",
    name: "Template 1: Direct Clean (Ultra-Minimalist)",
    tagline: "Uncluttered, authentic 1-on-1 feel with highest deliverability",
    description: "Frameless pure layout without bulky cards or shadows. Reads like a natural, high-priority direct email written in Superhuman / Apple Mail."
  },
  {
    id: "template2",
    name: "Template 2: Modern Tech (Sleek Hairline Card)",
    tagline: "Crisp hairline border, subtle off-white background (Linear/Stripe style)",
    description: "Contemporary SaaS aesthetic with a 1px subtle border, refined typography, elegant brand badge, and structured spacing."
  },
  {
    id: "template3",
    name: "Template 3: Executive Memo (Left Accent)",
    tagline: "High-contrast structured brief with elegant left accent bar",
    description: "Authoritative business memo style with dark slate typography, clean brand wordmark, and crisp left accent border."
  },
  {
    id: "template4",
    name: "Template 4: Warm Editorial (Soft Minimalist)",
    tagline: "Warm neutral tones, generous padding, and sophisticated typography",
    description: "Elegant layout with warm muted borders, spacious breathing room, and centered brand presentation."
  },
  {
    id: "default",
    name: "Classic Template (Original Card)",
    tagline: "Original card with purple top bar and rounded container",
    description: "The original multi-layer drop-shadow container with #4f46e5 top accent bar."
  }
];

// Plain-text rendering of a rich-text draft — used for the email's text/ part,
// the inbox snippet, and the preheader, none of which should show raw markup.
export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<(p|div|br|li|tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Many email clients (Outlook, mobile Gmail's clipped/AMP views, etc.) ignore
// class-based rules in a <style> block, so list markers silently disappear
// unless they're also declared inline on the <ul>/<ol>/<li> tags themselves.
function inlineListStyles(html: string, textColor: string = "#18181b"): string {
  return html
    .replace(/<p(?![^>]*style=)([^>]*)>/gi, `<p$1 style="margin:0 0 16px 0;color:${textColor};line-height:1.65;font-size:15px;">`)
    .replace(/<ul(?![^>]*style=)([^>]*)>/gi, `<ul$1 style="margin:0 0 16px 0;padding-left:20px;list-style-type:disc;color:${textColor};">`)
    .replace(/<ol(?![^>]*style=)([^>]*)>/gi, `<ol$1 style="margin:0 0 16px 0;padding-left:20px;list-style-type:decimal;color:${textColor};">`)
    .replace(/<li(?![^>]*style=)([^>]*)>/gi, `<li$1 style="margin:0 0 6px 0;color:${textColor};line-height:1.65;font-size:15px;">`);
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

interface RenderContext {
  richTextHtml: string;
  preheader: string;
  imageBlock: string;
  unsubscribeUrl: string;
  trackingPixel: string;
}

function buildContext(
  richTextHtml: string,
  imageUrl?: string,
  trackingPixelUrl?: string,
  email?: string,
  textColor: string = "#18181b"
): RenderContext {
  const preparedHtml = inlineListStyles(richTextHtml, textColor);
  const plain = stripHtml(preparedHtml);
  const firstLine = plain.split(/\n/).find((l) => l.trim()) || "A quick note from Rhinon Labs";
  const preheader = esc(firstLine.slice(0, 120));

  const trackingPixel = trackingPixelUrl
    ? `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px;" />`
    : "";

  const imageBlock = imageUrl
    ? `<tr><td style="padding:0 0 20px 0;"><img src="${imageUrl}" alt="" width="580" style="display:block;width:100%;max-width:580px;height:auto;border-radius:6px;border:0;" /></td></tr>`
    : "";

  const unsubscribeUrl = email
    ? `https://www.rhinonlabs.com/unsubscribe?email=${encodeURIComponent(email)}`
    : `https://www.rhinonlabs.com/unsubscribe`;

  return {
    richTextHtml: preparedHtml,
    preheader,
    imageBlock,
    unsubscribeUrl,
    trackingPixel,
  };
}

// ---------------------------------------------------------------------------
// TEMPLATE 1: DIRECT CLEAN (Ultra-Minimalist & High Deliverability)
// ---------------------------------------------------------------------------
export function renderTemplate1(ctx: RenderContext): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Rhinon Labs</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body,table,td,p,a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
    a { color:#2563eb; text-decoration:underline; }
    .email-body { font-size:15px; line-height:1.65; color:#18181b; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
    .email-body p { margin:0 0 16px 0; color:#18181b; }
    .email-body ul { margin:0 0 16px 0; padding-left:20px; list-style-type:disc; color:#18181b; }
    .email-body ol { margin:0 0 16px 0; padding-left:20px; list-style-type:decimal; color:#18181b; }
    .email-body li { margin:0 0 6px 0; color:#18181b; }
    .email-body strong { color:#09090b; }
    @media only screen and (max-width:620px) {
      .outer-cell { padding: 20px 16px !important; }
      .container { width:100% !important; max-width:100% !important; }
    }
    @media (prefers-color-scheme: dark) {
      .bg-main { background:#121214 !important; }
      .card-wrap { background:#121214 !important; }
      .email-body, .email-body p, .email-body li, .email-body strong { color:#f4f4f5 !important; }
      .text-muted { color:#71717a !important; }
      .border-line { border-color:#27272a !important; }
      a { color:#60a5fa !important; }
    }
  </style>
</head>
<body class="bg-main" style="margin:0;padding:0;width:100%;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${ctx.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg-main" style="background:#ffffff;">
    <tr>
      <td class="outer-cell" align="left" style="padding:36px 24px 44px 24px;">
        <!--[if mso]><table role="presentation" width="580" cellpadding="0" cellspacing="0" align="center"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="container card-wrap" style="max-width:580px;margin:0 auto;background:#ffffff;">
          ${ctx.imageBlock}
          <tr>
            <td style="padding:0 0 32px 0;">
              <div class="email-body" style="font-size:15px;line-height:1.65;color:#18181b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${ctx.richTextHtml}</div>
            </td>
          </tr>
          <tr>
            <td class="border-line" style="border-top:1px solid #f0f0f2;padding-top:20px;text-align:left;">
              <p class="text-muted" style="margin:0;font-size:12px;line-height:1.6;color:#a1a1aa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Rhinon Labs · <a href="${ctx.unsubscribeUrl}" target="_blank" style="color:#71717a;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
  ${ctx.trackingPixel}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// TEMPLATE 2: MODERN TECH (Sleek Hairline Card - Stripe / Linear Aesthetic)
// ---------------------------------------------------------------------------
export function renderTemplate2(ctx: RenderContext): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Rhinon Labs</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body,table,td,p,a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
    a { color:#2563eb; }
    .email-body { font-size:15px; line-height:1.65; color:#1e293b; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
    .email-body p { margin:0 0 16px 0; color:#1e293b; }
    .email-body ul { margin:0 0 16px 0; padding-left:20px; list-style-type:disc; color:#1e293b; }
    .email-body ol { margin:0 0 16px 0; padding-left:20px; list-style-type:decimal; color:#1e293b; }
    .email-body li { margin:0 0 6px 0; color:#1e293b; }
    .email-body strong { color:#0f172a; }
    .email-body a { color:#2563eb; font-weight:500; }
    @media only screen and (max-width:620px) {
      .outer-cell { padding: 14px 10px !important; }
      .card-wrap { width:100% !important; max-width:100% !important; border-radius:6px !important; }
      .content-padding { padding: 24px 20px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .bg-outer { background:#0b0f19 !important; }
      .card-wrap { background:#151c2c !important; border-color:#26334d !important; }
      .email-body, .email-body p, .email-body li, .email-body strong { color:#f1f5f9 !important; }
      .header-brand { color:#ffffff !important; }
      .text-muted { color:#94a3b8 !important; }
      .header-border { border-color:#26334d !important; }
      .footer-bg { background:#111726 !important; border-color:#26334d !important; }
      a { color:#60a5fa !important; }
    }
  </style>
</head>
<body class="bg-outer" style="margin:0;padding:0;width:100%;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${ctx.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg-outer" style="background:#f8fafc;">
    <tr>
      <td class="outer-cell" align="center" style="padding:40px 16px;">
        <!--[if mso]><table role="presentation" width="590" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card-wrap" style="max-width:590px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:0 auto;">
          
          <!-- Header Bar -->
          <tr>
            <td class="header-border" style="padding:22px 32px 18px 32px;border-bottom:1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <span class="header-brand" style="font-size:14px;font-weight:700;letter-spacing:-0.02em;color:#0f172a;text-transform:uppercase;">RHINON LABS</span>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="display:inline-block;width:6px;height:6px;background:#10b981;border-radius:50%;margin-right:6px;vertical-align:middle;"></span>
                    <span class="text-muted" style="font-size:11px;font-weight:500;color:#64748b;vertical-align:middle;">Verified</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${ctx.imageBlock}

          <!-- Main Content -->
          <tr>
            <td class="content-padding" style="padding:32px 32px 28px 32px;">
              <div class="email-body" style="font-size:15px;line-height:1.65;color:#1e293b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${ctx.richTextHtml}</div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer-bg" style="padding:18px 32px 22px 32px;border-top:1px solid #f1f5f9;background:#fafafa;text-align:center;">
              <p class="text-muted" style="margin:0;font-size:12px;line-height:1.5;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Sent with precision from Rhinon Labs · <a href="${ctx.unsubscribeUrl}" target="_blank" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
  ${ctx.trackingPixel}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// TEMPLATE 3: EXECUTIVE MEMO (Left Accent & Structured Editorial - Strictly White & Black)
// ---------------------------------------------------------------------------
export function renderTemplate3(ctx: RenderContext): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="only light">
  <meta name="supported-color-schemes" content="light">
  <title>Rhinon Labs Memo</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    :root { color-scheme: only light; supported-color-schemes: light; }
    body,table,td,p,a,div,span,li { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
    a { color:#111827 !important; text-decoration:underline; font-weight:600; }
    .email-body { font-size:15px; line-height:1.7; color:#111827 !important; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
    .email-body p { margin:0 0 18px 0; color:#111827 !important; }
    .email-body ul { margin:0 0 18px 0; padding-left:20px; list-style-type:disc; color:#111827 !important; }
    .email-body ol { margin:0 0 18px 0; padding-left:20px; list-style-type:decimal; color:#111827 !important; }
    .email-body li { margin:0 0 7px 0; color:#111827 !important; }
    .email-body strong { color:#000000 !important; font-weight:700; }
    
    @media only screen and (max-width:620px) {
      .outer-cell { padding: 16px 10px !important; }
      .container { width:100% !important; max-width:100% !important; }
      .memo-body { padding: 16px 20px 24px 20px !important; }
      .memo-header { padding: 24px 20px 14px 20px !important; }
      .memo-footer { padding: 16px 20px 20px 20px !important; }
    }
    
    /* Enforce pure white background and black text even if browser tries dark mode */
    @media (prefers-color-scheme: dark) {
      body, html, table, tr, td, .bg-white-locked {
        background: #ffffff !important;
        background-color: #ffffff !important;
      }
      .email-body, .email-body p, .email-body li, .email-body strong, .header-title, a {
        color: #111827 !important;
      }
      .text-sub {
        color: #4b5563 !important;
      }
      .accent-line {
        border-left: 3px solid #111827 !important;
      }
      .card-border {
        border-color: #e5e7eb !important;
      }
    }
  </style>
</head>
<body bgcolor="#ffffff" class="bg-white-locked" style="margin:0;padding:0;width:100%;background:#ffffff !important;background-color:#ffffff !important;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827 !important;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${ctx.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" class="bg-white-locked" style="background:#ffffff !important;background-color:#ffffff !important;">
    <tr>
      <td class="outer-cell bg-white-locked" align="center" bgcolor="#ffffff" style="padding:40px 16px;background:#ffffff !important;background-color:#ffffff !important;">
        <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" class="container bg-white-locked card-border" style="max-width:600px;background:#ffffff !important;background-color:#ffffff !important;margin:0 auto;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
          
          <!-- Header with Left Accent Indicator -->
          <tr>
            <td class="memo-header bg-white-locked" bgcolor="#ffffff" style="padding:28px 36px 18px 36px;background:#ffffff !important;background-color:#ffffff !important;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="accent-line" style="border-left:3px solid #111827;padding-left:14px;">
                    <span class="header-title" style="font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#111827 !important;display:block;">RHINON LABS</span>
                    <span class="text-sub" style="font-size:11px;font-weight:500;color:#4b5563 !important;margin-top:2px;display:block;">Executive Briefing</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${ctx.imageBlock}

          <!-- Content Body -->
          <tr>
            <td class="memo-body bg-white-locked" bgcolor="#ffffff" style="padding:10px 36px 32px 36px;background:#ffffff !important;background-color:#ffffff !important;">
              <div class="email-body" style="font-size:15px;line-height:1.7;color:#111827 !important;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${ctx.richTextHtml}</div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="memo-footer bg-white-locked card-border" bgcolor="#ffffff" style="padding:20px 36px 24px 36px;border-top:1px solid #f3f4f6;background:#ffffff !important;background-color:#ffffff !important;text-align:left;">
              <p class="text-sub" style="margin:0;font-size:11px;line-height:1.6;color:#6b7280 !important;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Confidential &amp; Proprietary · Rhinon Labs<br/>
                <a href="${ctx.unsubscribeUrl}" target="_blank" style="color:#6b7280 !important;font-weight:normal;text-decoration:underline;">Unsubscribe from this thread</a>
              </p>
            </td>
          </tr>

        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
  ${ctx.trackingPixel}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// TEMPLATE 4: WARM EDITORIAL (Soft Minimalist & Refined Spacing)
// ---------------------------------------------------------------------------
export function renderTemplate4(ctx: RenderContext): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Rhinon Labs</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body,table,td,p,a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
    a { color:#3b82f6; text-decoration:underline; }
    .email-body { font-size:15.5px; line-height:1.7; color:#27272a; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
    .email-body p { margin:0 0 18px 0; color:#27272a; }
    .email-body ul { margin:0 0 18px 0; padding-left:22px; list-style-type:disc; color:#27272a; }
    .email-body ol { margin:0 0 18px 0; padding-left:22px; list-style-type:decimal; color:#27272a; }
    .email-body li { margin:0 0 6px 0; color:#27272a; }
    .email-body strong { color:#09090b; }
    @media only screen and (max-width:620px) {
      .outer-cell { padding: 18px 12px !important; }
      .container { width:100% !important; max-width:100% !important; border-radius:8px !important; }
      .body-cell { padding: 28px 20px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .bg-outer { background:#121214 !important; }
      .card-wrap { background:#1c1c1f !important; border-color:#2c2c30 !important; }
      .email-body, .email-body p, .email-body li, .email-body strong { color:#f4f4f5 !important; }
      .text-muted { color:#a1a1aa !important; }
      .divider-line { border-color:#2c2c30 !important; }
      a { color:#60a5fa !important; }
    }
  </style>
</head>
<body class="bg-outer" style="margin:0;padding:0;width:100%;background:#faf9f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#27272a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${ctx.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg-outer" style="background:#faf9f6;">
    <tr>
      <td class="outer-cell" align="center" style="padding:48px 16px;">
        <!--[if mso]><table role="presentation" width="580" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="container card-wrap" style="max-width:580px;background:#ffffff;border:1px solid #ede9e3;border-radius:14px;overflow:hidden;margin:0 auto;">
          
          ${ctx.imageBlock}

          <!-- Body Content -->
          <tr>
            <td class="body-cell" style="padding:40px 36px 32px 36px;">
              <div class="email-body" style="font-size:15.5px;line-height:1.7;color:#27272a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${ctx.richTextHtml}</div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="divider-line" style="padding:18px 36px 26px 36px;border-top:1px solid #f4f1eb;text-align:center;">
              <p class="text-muted" style="margin:0;font-size:12px;line-height:1.6;color:#a8a29e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Sent from Rhinon Labs · <a href="${ctx.unsubscribeUrl}" target="_blank" style="color:#78716c;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
  ${ctx.trackingPixel}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// DEFAULT TEMPLATE (Original Legacy Card)
// ---------------------------------------------------------------------------
export function renderDefaultTemplate(ctx: RenderContext): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Rhinon Labs</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body,table,td,p,a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
    a { color:#4f46e5; }
    .tiptap-content { line-height:1.65; color:#1f2937; font-size:15px; mso-line-height-rule:exactly; }
    .tiptap-content p { margin:0 0 18px 0; color:#1f2937; }
    .tiptap-content ul { margin:0 0 18px 0; padding-left:22px; list-style-type:disc; color:#1f2937; }
    .tiptap-content ol { margin:0 0 18px 0; padding-left:22px; list-style-type:decimal; color:#1f2937; }
    .tiptap-content li { margin:0 0 6px 0; color:#1f2937; }
    .tiptap-content a { color:#4f46e5; }
    @media only screen and (max-width:620px) {
      .outer-cell { padding: 16px 0 !important; }
      .container { width:100% !important; max-width:100% !important; border-radius:0 !important; box-shadow:none !important; }
      .px { padding-left:16px !important; padding-right:16px !important; padding-top:28px !important; padding-bottom:24px !important; }
      .logo { width:150px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .email-bg { background:#0b0b0c !important; }
      .card { background:#161618 !important; box-shadow:none !important; }
      .text, .tiptap-content, .tiptap-content p, .tiptap-content li { color:#e5e7eb !important; }
      .muted { color:#8b8f98 !important; }
      .divider { border-color:#27272a !important; }
      .unsub-link { color:#a5b4fc !important; }
      a { color:#a5b4fc !important; }
    }
  </style>
</head>
<body class="email-bg" style="margin:0;padding:0;width:100%;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${ctx.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="background:#f4f4f5;">
    <tr><td class="outer-cell" align="center" style="padding:40px 16px">
      <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="container card" style="width:600px;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 10px 28px rgba(0,0,0,0.06)">
        
        <tr><td style="height:3px;line-height:3px;font-size:0;background:#4f46e5">&nbsp;</td></tr>
        ${ctx.imageBlock}
        <tr><td class="px" style="padding:38px 40px 8px">
          <div class="tiptap-content" style="color:#1f2937;font-size:15px;line-height:1.65;">${ctx.richTextHtml}</div>
        </td></tr>

        <tr><td class="px divider" style="padding:16px 40px 24px;border-top:1px solid #f0f0f2;text-align:center;">
          <p class="muted" style="margin:0;font-size:12px;line-height:1.5;color:#8b8f98;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            No longer want to receive these emails? <a href="${ctx.unsubscribeUrl}" target="_blank" class="unsub-link" style="color:#6366f1;text-decoration:underline;font-weight:500;">unsubscribe</a>
          </p>
        </td></tr>
        
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
  ${ctx.trackingPixel}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Unified Dispatcher
// ---------------------------------------------------------------------------
export function renderEmailTemplate(
  templateId: string = "template1",
  options: {
    richTextHtml: string;
    imageUrl?: string;
    trackingPixelUrl?: string;
    email?: string;
  }
): string {
  const normalized = (templateId || "").toLowerCase().trim();
  const textColor = normalized === "template3" || normalized === "memo"
    ? "#0f172a"
    : normalized === "template2"
      ? "#1e293b"
      : "#18181b";

  const ctx = buildContext(
    options.richTextHtml,
    options.imageUrl,
    options.trackingPixelUrl,
    options.email,
    textColor
  );

  switch (normalized) {
    case "template1":
    case "direct":
    case "minimal":
      return renderTemplate1(ctx);
    case "template2":
    case "card":
    case "tech":
      return renderTemplate2(ctx);
    case "template3":
    case "memo":
    case "executive":
      return renderTemplate3(ctx);
    case "template4":
    case "editorial":
    case "warm":
      return renderTemplate4(ctx);
    case "default":
    case "classic":
    case "legacy":
      return renderDefaultTemplate(ctx);
    default:
      // If configured via process.env.EMAIL_TEMPLATE, respect it
      if (process.env.EMAIL_TEMPLATE && process.env.EMAIL_TEMPLATE !== normalized) {
        return renderEmailTemplate(process.env.EMAIL_TEMPLATE, options);
      }
      return renderTemplate1(ctx);
  }
}

/**
 * Main export used across backend routes & workflow engine.
 * Supports an optional template argument (e.g. "template1", "template2", "template3", "template4", "default")
 * or falls back to EMAIL_TEMPLATE env var or "template1".
 */
export function toEmailHtml(
  richTextHtml: string,
  imageUrl?: string,
  trackingPixelUrl?: string,
  email?: string,
  template?: string
): string {
  const selectedTemplate = template || process.env.EMAIL_TEMPLATE || "template1";
  return renderEmailTemplate(selectedTemplate, {
    richTextHtml,
    imageUrl,
    trackingPixelUrl,
    email,
  });
}
