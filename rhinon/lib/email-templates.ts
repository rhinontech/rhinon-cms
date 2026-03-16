export function generateEmailHtml(content: string): string {
  const bodyHtml = content
    .replace(/^#+\s+(.*)$/gm, '<h2 style="color: #f8fafc; margin: 15px 0 8px 0; font-weight: 800; font-size: 20px; text-align: left;">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #38bdf8; font-weight: 800;">$1</strong>')
    .replace(/^[\*\-]\s+(.*)$/gm, '<li style="margin-bottom: 6px; color: #94a3b8;">$1</li>')
    .split('\n\n')
    .map(p => {
      if (p.includes('<li') && !p.includes('<ul')) {
        return `<ul style="padding-left: 20px; margin-bottom: 12px; list-style-type: disc; color: #38bdf8; text-align: left;">${p}</ul>`;
      }
      if (p.startsWith('<h2')) return p;
      return `<p style="margin-bottom: 12px; color: #cbd5e1; line-height: 1.6; font-size: 15px; text-align: left;">${p.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
<title></title>
<meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none; background-color: #020617; }
    @media (max-width:520px) {
        .row-content { width: 100% !important; }
        .stack .column { width: 100%; display: block; }
    }
</style>
</head>
<body style="background-color: #020617; margin: 0; padding: 0;">
<table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #020617;" width="100%">
<tbody>
<tr>
<td>
    <!-- Logo Header -->
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 550px; margin: 0 auto;" width="550">
    <tbody>
    <tr>
    <td class="column column-1" style="padding-top: 30px; padding-bottom: 20px; text-align: center;" width="100%">
        <img src="https://www.rhinonlabs.com/assets/Logo_Rhinon_Web_Full.png" style="display: inline-block; height: auto; border: 0; width: 100%; max-width: 280px; filter: brightness(0) invert(1);" alt="Rhinon Tech" />
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>

    <!-- Main Message Body -->
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: 12px; background-color: #0f172a; color: #cbd5e1; width: 550px; margin: 0 auto; border: 1px solid #1e293b;" width="550">
    <tbody>
    <tr>
    <td class="column column-1" style="padding: 40px 35px; vertical-align: top;" width="100%">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
        <tr>
        <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6;">
            ${bodyHtml}
        </td>
        </tr>
        </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>

    <!-- Footer -->
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 550px; margin: 0 auto;" width="550">
    <tbody>
    <tr>
    <td class="column column-1" style="padding: 30px 10px; text-align: center; color: #475569; font-size: 11px; font-family: Arial, sans-serif; letter-spacing: 1px;" width="100%">
        <p style="margin: 0; font-weight: 700; text-transform: uppercase;">Rhinon Tech • Intelligence Orchestrated</p>
        <p style="margin: 8px 0 0 0;">© 2026 Rhinon Tech. <a href="#" style="color: #38bdf8; text-decoration: none;">Unsubscribe</a></p>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
</td>
</tr>
</tbody>
</table>
</body>
</html>
  `;
}
