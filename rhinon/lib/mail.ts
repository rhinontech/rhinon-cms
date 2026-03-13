import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_PORT === "465",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: `"Rhinon Labs" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: body,
    html: body.replace(/\n/g, "<br>"),
  });

  return info;
}
