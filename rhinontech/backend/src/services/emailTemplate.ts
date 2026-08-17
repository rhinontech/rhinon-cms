// Shared branded HTML email wrapper — used by both the Outreach campaign
// engine and the Automation workflow engine, so every rich-text email (from
// either the campaign composer or a workflow's "Send email" node) renders
// consistently, with the same cross-client list-style fixes and branding.

const BRAND_LOGO_URL = process.env.BRAND_LOGO_URL || "https://www.rhinonlabs.com/Logo_Rhinon_Labs_Light.png";
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || ""; // registered address for compliant footer
export const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5002";

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
function inlineListStyles(html: string): string {
  return html
    .replace(/<ul(?![^>]*style=)([^>]*)>/gi, '<ul$1 style="margin:0 0 18px 0;padding-left:22px;list-style-type:disc;">')
    .replace(/<ol(?![^>]*style=)([^>]*)>/gi, '<ol$1 style="margin:0 0 18px 0;padding-left:22px;list-style-type:decimal;">')
    .replace(/<li(?![^>]*style=)([^>]*)>/gi, '<li$1 style="margin:0 0 6px 0;">');
}

// Premium, responsive, light/dark-aware HTML email (bulletproof table layout).
// `richTextHtml` is already-formatted HTML from a TipTap rich-text editor.
// `trackingPixelUrl`, when given, is appended as a hidden 1x1 image so an open
// can be recorded — omitted entirely for previews/tests where there's no real send to track.
export function toEmailHtml(richTextHtml: string, imageUrl?: string, trackingPixelUrl?: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  richTextHtml = inlineListStyles(richTextHtml);

  const trackingPixel = trackingPixelUrl
    ? `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px;" />`
    : "";

  // Hidden inbox preview text (first real line of the email)
  const preheader = esc((stripHtml(richTextHtml).split(/\n/).find(l => l.trim()) || "A quick note from Rhinon Labs").slice(0, 120));

  const imageBlock = imageUrl
    ? `<tr><td style="padding:0"><img src="${imageUrl}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0" /></td></tr>`
    : "";

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
    .tiptap-content p { margin:0 0 18px 0; }
    .tiptap-content ul { margin:0 0 18px 0; padding-left:22px; list-style-type:disc; }
    .tiptap-content ol { margin:0 0 18px 0; padding-left:22px; list-style-type:decimal; }
    .tiptap-content li { margin:0 0 6px 0; }
    .tiptap-content a { color:#4f46e5; }
    @media only screen and (max-width:620px) {
      .container { width:100% !important; border-radius:0 !important; }
      .px { padding-left:24px !important; padding-right:24px !important; }
      .logo { width:150px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .email-bg { background:#0b0b0c !important; }
      .card { background:#161618 !important; box-shadow:none !important; }
      .text, .tiptap-content { color:#e5e7eb !important; }
      .muted { color:#8b8f98 !important; }
      .divider { border-color:#27272a !important; }
      a { color:#a5b4fc !important; }
    }
  </style>
</head>
<body class="email-bg" style="margin:0;padding:0;width:100%;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="background:#f4f4f5">
    <tr><td align="center" style="padding:40px 16px">
      <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="container card" style="width:600px;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 10px 28px rgba(0,0,0,0.06)">
        <tr><td align="center" style="background:#0f0f0f;padding:30px 32px">
          <img class="logo" src="${BRAND_LOGO_URL}" alt="Rhinon Labs" width="170" style="display:block;width:170px;max-width:170px;height:auto;border:0" />
        </td></tr>
        <tr><td style="height:3px;line-height:3px;font-size:0;background:#4f46e5">&nbsp;</td></tr>
        ${imageBlock}
        <tr><td class="px" style="padding:38px 40px 8px">
          <div class="tiptap-content">${richTextHtml}</div>
        </td></tr>

        <tr><td class="px divider" style="padding:18px 40px 32px;border-top:1px solid #ececed">
          <p class="muted" style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af">
            Rhinon Labs is a product of Rhinon Tech Pvt&nbsp;Ltd${COMPANY_ADDRESS ? ` &middot; ${esc(COMPANY_ADDRESS)}` : ""}.<br>
            You received this because we believe Rhinon Labs may be a fit for your operations. Not interested? Just reply &ldquo;unsubscribe&rdquo; and we&rsquo;ll remove you.
          </p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
  ${trackingPixel}
</body>
</html>`;
}
