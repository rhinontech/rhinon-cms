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

// ─── Collaborator invite ─────────────────────────────────────────────────────

interface CollaboratorInviteOptions {
  fullName: string;
  projectName: string;
  invitedByName: string;
  loginEmail: string;
  onboardingUrl: string;
}

export function collaboratorInviteEmail({
  fullName, projectName, invitedByName, loginEmail, onboardingUrl,
}: CollaboratorInviteOptions) {
  const firstName = fullName.split(" ")[0];
  const subject = `${invitedByName} invited you to collaborate on ${projectName}`;

  const headerContent = `<p style="margin:16px 0 0;font-size:13px;color:#a8a29e;">Project collaboration</p>`;
  const bodyContent = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1c1917;">Hi ${firstName},</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:#44403c;">
      <strong>${invitedByName}</strong> has invited you to collaborate on
      <strong>${projectName}</strong>. You'll be able to see the tasks shared with you,
      track their progress, and comment.
    </p>
    <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#44403c;">
      Sign in with <strong>${loginEmail}</strong> after setting your password.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#1c1917;border-radius:8px;">
          <a href="${onboardingUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
            Set your password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:12px;line-height:18px;color:#a8a29e;">
      This link expires in 48 hours. You'll only ever see the projects and tasks
      that have been shared with you.
    </p>`;

  const text = `Hi ${firstName},

${invitedByName} has invited you to collaborate on ${projectName}.

Set your password: ${onboardingUrl}
Sign in with: ${loginEmail}

This link expires in 48 hours.`;

  return { subject, html: emailWrapper(headerContent, bodyContent), text };
}

// ─── Welcome / Onboarding ────────────────────────────────────────────────────

interface WelcomeEmailOptions {
  fullName: string;
  companyEmail: string;
  tempPassword: string;
  onboardingUrl: string;
  signingUrl?: string;
}

export function welcomeEmail({ fullName, companyEmail, tempPassword, onboardingUrl, signingUrl }: WelcomeEmailOptions) {
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
    <table cellpadding="0" cellspacing="0" style="margin-bottom:${signingUrl ? "16px" : "28px"};">
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
    </p>

    ${signingUrl ? `
    <!-- Document signing -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;padding-top:24px;border-top:1px solid #e7e5e4;">
      <tr><td>
        <p style="margin:0 0 14px;font-size:13px;color:#78716c;line-height:1.7;">
          Please also review and sign your <strong style="color:#1c1917;">Offer Letter</strong> and <strong style="color:#1c1917;">Non-Disclosure Agreement (NDA)</strong> online — no printing needed.
          <strong style="color:#1c1917;">This link expires in 48 hours.</strong>
        </p>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="border:1px solid #1c1917;border-radius:8px;">
              <a href="${signingUrl}" style="display:inline-block;padding:11px 24px;font-size:13px;font-weight:600;color:#1c1917;text-decoration:none;letter-spacing:-0.1px;">
                Review &amp; Sign Documents →
              </a>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>` : ""}`;

  const html = emailWrapper(header, body);

  const text = `Welcome to Rhinon Tech, ${firstName}!

Your account has been created.

Company Email: ${companyEmail}
Temporary Password: ${tempPassword}

Set up your account: ${onboardingUrl}

This link expires in 48 hours.
${signingUrl ? `\nPlease also review and sign your Offer Letter and Non-Disclosure Agreement (NDA): ${signingUrl}\nThis link expires in 48 hours.` : ""}`;

  return { subject, html, text };
}

// ─── Stage 1: Congratulations + sign documents (no credentials yet) ──────────
// Sent when a member is created with documents to e-sign. The credentials /
// account-setup email (welcomeEmail, above) is triggered automatically once
// both documents are signed — see routes/documentSigning.ts.

interface SignDocumentsEmailOptions {
  fullName: string;
  roleTitle?: string;
  signingUrl: string;
  // True when re-sending after an admin edited an already-issued (unsigned)
  // document — swaps the first-time "welcome" framing for an "updated,
  // please re-review" one. See POST /employees/:id/documents/:category/resend.
  updated?: boolean;
}

export function signDocumentsEmail({ fullName, roleTitle, signingUrl, updated }: SignDocumentsEmailOptions) {
  const firstName = fullName.split(" ")[0];
  const roleBit = roleTitle ? ` as ${roleTitle}` : "";
  const subject = updated ? `Your Offer Letter has been updated — Rhinon Tech` : `Congratulations — Welcome to Rhinon Tech`;

  const header = updated
    ? `
    <p style="margin:16px 0 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.4px;">
      Your documents have<br/>been updated
    </p>`
    : `
    <p style="margin:16px 0 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.4px;">
      Congratulations &<br/>welcome aboard
    </p>`;

  const intro = updated
    ? `<p style="margin:0 0 24px;font-size:14px;color:#78716c;line-height:1.7;">
      We've made an update to your onboarding documents at <strong style="color:#1c1917;">Rhinon Tech</strong>${roleBit}. Please review the latest version below.
    </p>`
    : `<p style="margin:0 0 24px;font-size:14px;color:#78716c;line-height:1.7;">
      Congratulations on joining <strong style="color:#1c1917;">Rhinon Tech</strong>${roleBit}! We're excited to have you on the team.
    </p>`;

  const body = `
    <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#1c1917;">Hi ${firstName},</p>
    ${intro}

    <p style="margin:0 0 20px;font-size:13px;color:#78716c;line-height:1.7;">
      ${updated ? "Please review and e-sign your" : "Your first step: review and e-sign your"} <strong style="color:#1c1917;">Offer Letter</strong> and
      <strong style="color:#1c1917;">Non-Disclosure Agreement (NDA)</strong> online — no printing needed.<br/>
      <strong style="color:#1c1917;">This link expires in 48 hours.</strong>
    </p>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#1c1917;border-radius:8px;">
          <a href="${signingUrl}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
            Review &amp; Sign Documents →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px;font-size:12px;color:#a8a29e;line-height:1.7;">
      If the button doesn't work, copy this link into your browser:<br/>
      <a href="${signingUrl}" style="color:#78716c;word-break:break-all;">${signingUrl}</a>
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:10px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0;font-size:13px;color:#78716c;line-height:1.7;">
          <strong style="color:#1c1917;">What happens next?</strong><br/>
          As soon as both documents are signed, we'll automatically email you your account credentials and setup link.
        </p>
      </td></tr>
    </table>`;

  const html = emailWrapper(header, body);

  const text = updated
    ? `Hi ${firstName}, we've updated your onboarding documents at Rhinon Tech${roleBit}.

Please review and e-sign your Offer Letter and Non-Disclosure Agreement (NDA):
${signingUrl}`
    : `Congratulations, ${firstName} — welcome to Rhinon Tech${roleBit}!

Your first step: review and e-sign your Offer Letter and Non-Disclosure Agreement (NDA):
${signingUrl}`;

  const textFooter = `

This link expires in 48 hours.

What happens next? As soon as both documents are signed, we'll automatically email you your account credentials and setup link.`;

  return { subject, html, text: text + textFooter };
}

// ─── Password Reset ──────────────────────────────────────────────────────────

interface ResetPasswordEmailOptions {
  fullName: string;
  resetUrl: string;
  expiresInLabel?: string; // e.g. "1 hour"
}

export function resetPasswordEmail({ fullName, resetUrl, expiresInLabel = "1 hour" }: ResetPasswordEmailOptions) {
  const firstName = fullName.split(" ")[0];
  const subject = `Reset your Rhinon Tech password`;

  const header = `
    <p style="margin:16px 0 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.4px;">
      Reset your<br/>password
    </p>`;

  const body = `
    <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#1c1917;">Hi ${firstName},</p>
    <p style="margin:0 0 24px;font-size:14px;color:#78716c;line-height:1.7;">
      We received a request to reset the password for your Rhinon Tech account. Click below to choose a new one.
    </p>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#1c1917;border-radius:8px;">
          <a href="${resetUrl}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
            Reset Password →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px;font-size:13px;color:#78716c;line-height:1.7;">
      <strong style="color:#1c1917;">This link expires in ${expiresInLabel}.</strong> If you didn't request a password reset, you can safely ignore this email — your password won't change.
    </p>

    <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.7;">
      If the button doesn't work, copy this link into your browser:<br/>
      <a href="${resetUrl}" style="color:#78716c;word-break:break-all;">${resetUrl}</a>
    </p>`;

  const html = emailWrapper(header, body);

  const text = `Hi ${firstName},

We received a request to reset your Rhinon Tech password.

Reset your password: ${resetUrl}

This link expires in ${expiresInLabel}. If you didn't request this, ignore this email.`;

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
