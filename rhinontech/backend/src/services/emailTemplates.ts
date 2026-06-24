const logoImg = `<img src="https://api.rhinontech.in/static/logo-white.png" alt="Rhinon Tech" width="36" height="36" style="display:block;" />`;

function emailWrapper(headerContent: string, bodyContent: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f4;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo header -->
          <tr>
            <td style="background-color:#1c1917;border-radius:12px 12px 0 0;padding:24px 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">${logoImg}</td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:16px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Rhinon Tech</span>
                  </td>
                </tr>
              </table>
              ${headerContent}
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 12px 12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a8a29e;">
                Rhinon Tech · Hyderabad, Telangana, India
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#d6d3d1;">
                If you need assistance, please reach out to your HR team.
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

// ─── Welcome / Onboarding ────────────────────────────────────────────────────

interface WelcomeEmailOptions {
  fullName: string;
  companyEmail: string;
  tempPassword: string;
  onboardingUrl: string;
}

export function welcomeEmail({ fullName, companyEmail, tempPassword, onboardingUrl }: WelcomeEmailOptions) {
  const firstName = fullName.split(" ")[0];
  const subject = `Welcome to Rhinon Tech — Set up your account`;

  const header = `
    <p style="margin:16px 0 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.4px;">
      You've been invited to<br/>Rhinon Tech
    </p>`;

  const body = `
    <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#1c1917;">Hi ${firstName},</p>
    <p style="margin:0 0 28px;font-size:14px;color:#78716c;line-height:1.7;">
      Your account has been created on the Rhinon Tech Admin Panel. Use the credentials below to get started.
    </p>

    <!-- Credentials card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:10px;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 16px;font-size:11px;font-weight:600;color:#a8a29e;letter-spacing:0.08em;text-transform:uppercase;">Your credentials</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e7e5e4;">
              <span style="font-size:11px;color:#a8a29e;display:block;margin-bottom:3px;text-transform:uppercase;letter-spacing:0.06em;">Company Email</span>
              <span style="font-size:14px;font-weight:600;color:#1c1917;">${companyEmail}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0 0;">
              <span style="font-size:11px;color:#a8a29e;display:block;margin-bottom:3px;text-transform:uppercase;letter-spacing:0.06em;">Temporary Password</span>
              <span style="font-size:15px;font-weight:700;color:#1c1917;font-family:'Courier New',monospace;background:#f5f5f4;padding:4px 8px;border-radius:4px;display:inline-block;">${tempPassword}</span>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="margin:0 0 20px;font-size:13px;color:#78716c;line-height:1.7;">
      Click below to set your own password and complete your account setup.<br/>
      <strong style="color:#1c1917;">This link expires in 48 hours.</strong>
    </p>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:#1c1917;border-radius:8px;">
          <a href="${onboardingUrl}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
            Set Up Your Account →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.7;">
      If the button doesn't work, copy this link into your browser:<br/>
      <a href="${onboardingUrl}" style="color:#78716c;word-break:break-all;">${onboardingUrl}</a>
    </p>`;

  const html = emailWrapper(header, body);

  const text = `Welcome to Rhinon Tech, ${firstName}!

Your account has been created.

Company Email: ${companyEmail}
Temporary Password: ${tempPassword}

Set up your account: ${onboardingUrl}

This link expires in 48 hours.`;

  return { subject, html, text };
}

// ─── Payslip Paid ────────────────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface PayslipPaidEmailOptions {
  fullName: string;
  companyEmail: string;
  netPay: number;
  grossPay: number;
  month: number;
  year: number;
  bankAccountNumber?: string | null;
  payslipUrl: string;
}

export function payslipPaidEmail({ fullName, companyEmail, netPay, grossPay, month, year, bankAccountNumber, payslipUrl }: PayslipPaidEmailOptions) {
  const firstName = fullName.split(" ")[0];
  const period = `${MONTHS[month - 1]} ${year}`;
  const fmt = (n: number) => Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0 });
  const maskedAccount = bankAccountNumber ? `••••${bankAccountNumber.slice(-4)}` : null;
  const subject = `Salary Credited — ${period}`;

  const header = `
    <p style="margin:16px 0 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.4px;">
      Your salary has been<br/>credited
    </p>
    <p style="margin:8px 0 0;font-size:13px;color:#a8a29e;">${period}</p>`;

  const body = `
    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#1c1917;">Hi ${firstName},</p>
    <p style="margin:0 0 28px;font-size:14px;color:#78716c;line-height:1.7;">
      Your salary for <strong style="color:#1c1917;">${period}</strong> has been processed and will be credited to your bank account within 3–4 hours.
    </p>

    <!-- Amount highlight -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1c1917;border-radius:10px;margin-bottom:20px;">
      <tr><td style="padding:24px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#a8a29e;text-transform:uppercase;letter-spacing:0.08em;">Net Pay (Take-Home)</p>
        <p style="margin:0;font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-1px;">₹${fmt(netPay)}</p>
      </td></tr>
    </table>

    <!-- Payment details card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:10px;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 16px;font-size:11px;font-weight:600;color:#a8a29e;letter-spacing:0.08em;text-transform:uppercase;">Payment Details</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e7e5e4;">
              <span style="font-size:13px;color:#78716c;">Gross Pay</span>
            </td>
            <td style="padding:10px 0;border-bottom:1px solid #e7e5e4;text-align:right;">
              <span style="font-size:13px;font-weight:600;color:#1c1917;">₹${fmt(grossPay)}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e7e5e4;">
              <span style="font-size:13px;color:#78716c;">Payment Type</span>
            </td>
            <td style="padding:10px 0;border-bottom:1px solid #e7e5e4;text-align:right;">
              <span style="font-size:13px;font-weight:600;color:#1c1917;">Salary</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e7e5e4;">
              <span style="font-size:13px;color:#78716c;">Pay Period</span>
            </td>
            <td style="padding:10px 0;border-bottom:1px solid #e7e5e4;text-align:right;">
              <span style="font-size:13px;font-weight:600;color:#1c1917;">${period}</span>
            </td>
          </tr>
          ${maskedAccount ? `
          <tr>
            <td style="padding:10px 0 0;">
              <span style="font-size:13px;color:#78716c;">Account Number</span>
            </td>
            <td style="padding:10px 0 0;text-align:right;">
              <span style="font-size:13px;font-weight:600;color:#1c1917;">${maskedAccount}</span>
            </td>
          </tr>` : ""}
        </table>
      </td></tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#1c1917;border-radius:8px;">
          <a href="${payslipUrl}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
            View Payslip →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.7;">
      If you have any questions about your payslip, please contact your HR team.
    </p>`;

  const html = emailWrapper(header, body);

  const text = `Hi ${firstName},

Your salary for ${period} has been processed.

Net Pay: ₹${fmt(netPay)}
Gross Pay: ₹${fmt(grossPay)}
Pay Period: ${period}
${maskedAccount ? `Account: ${maskedAccount}` : ""}

View your payslip: ${payslipUrl}

If you have questions, contact your HR team.`;

  return { subject, html, text };
}
