function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatInlineMarkdown(value: string): string {
  return escapeHtml(value).replace(
    /\*\*(.+?)\*\*/g,
    '<strong style="color: #f8fafc; font-weight: 700;">$1</strong>'
  );
}

function renderContentBlocks(content: string): string {
  const trimmed = content.trim();
  
  // If the content looks like HTML (from Tiptap), pass it through with minimal processing
  // to avoid double-escaping or breaking rich-text structures.
  if (trimmed.startsWith("<") && trimmed.includes(">")) {
    return trimmed;
  }

  return content
    .trim()
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) {
        return "";
      }

      if (/^#{1,6}\s+/.test(trimmedBlock)) {
        const heading = trimmedBlock.replace(/^#{1,6}\s+/, "");
        return `<h1 style="margin: 0 0 16px 0; color: #1e293b; font-family: Arial, Helvetica, sans-serif; font-size: 22px; line-height: 1.3; font-weight: 800; letter-spacing: -0.02em; text-align: left;">${formatInlineMarkdown(heading)}</h1>`;
      }

      const lines = trimmedBlock
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length > 0 && lines.every((line) => /^[*-]\s+/.test(line))) {
        const items = lines
          .map((line) => line.replace(/^[*-]\s+/, ""))
          .map(
            (line) =>
              `<li style="margin: 0 0 10px 0; color: #334155;">${formatInlineMarkdown(line)}</li>`
          )
          .join("");

        return `<ul style="margin: 0 0 18px 20px; padding: 0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.65; color: #334155; text-align: left;">${items}</ul>`;
      }

      return `<p style="margin: 0 0 14px 0; color: #334155; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.75; text-align: left;">${lines
        .map(formatInlineMarkdown)
        .join("<br />")}</p>`;
    })
    .join("");
}

export function generateEmailHtml(content: string): string {
  const bodyHtml = renderContentBlocks(content);

  return `<!DOCTYPE html>
<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<title>Rhinon Labs Outreach</title>
<meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
<meta content="width=device-width, initial-scale=1.0" name="viewport" />
<style>
  body {
    margin: 0;
    padding: 0;
    -webkit-text-size-adjust: none;
    text-size-adjust: none;
    background-color: #f3f4f6;
  }

  table,
  td {
    border-collapse: collapse;
  }

  img {
    border: 0;
    display: block;
    line-height: 100%;
    outline: none;
    text-decoration: none;
  }

  p {
    margin: 0;
  }

  @media (max-width: 600px) {
    .email-shell {
      width: 100% !important;
    }

    .email-canvas {
      width: 100% !important;
    }

    .email-body {
      padding: 24px 20px !important;
    }

    .email-outer {
      padding: 20px 12px !important;
    }

    .email-header {
      padding: 24px 20px !important;
    }
  }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
    A tailored outreach note from Rhinon Labs.
  </div>
  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="width: 100%; background-color: #f3f4f6;">
    <tr>
      <td align="center" class="email-outer" style="padding: 28px 16px 22px;">
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="800" class="email-shell email-canvas" style="width: 800px; max-width: 800px; margin: 0 auto;">
          <tr>
            <td style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 18px; overflow: hidden;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr>
                  <td class="email-header" align="center" style="padding: 28px 32px; background-color: #172554;">
                    <img
                      src="https://www.rhinonlabs.com/assets/Logo_Rhinon_Web_Full.png"
                      alt="Rhinon Labs"
                      width="220"
                      style="width: 220px; max-width: 220px; height: auto; margin: 0 auto; filter: brightness(0) invert(1);"
                    />
                  </td>
                </tr>
                <tr>
                  <td class="email-body" style="padding: 32px 40px 28px; font-family: Arial, Helvetica, sans-serif;">
                    ${bodyHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 28px;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-top: 1px solid #e5e7eb;">
                      <tr>
                        <td style="padding-top: 16px;">
                          <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.6; color: #334155; font-weight: 700;">
                            Rhinon Labs
                          </p>
                          <p style="margin: 4px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.6; color: #64748b;">
                            AI systems, internal tools, and outreach infrastructure built to move faster.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 12px 16px 0;">
              <p style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.5; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8;">
                Rhinon Labs • Outreach Engine
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
