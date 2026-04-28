import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import { env } from "@/env";
import type { ReactElement } from "react";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailOptions): Promise<void> {
  const html = await render(react);
  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

export async function sendAdminNotification(subject: string, text: string): Promise<void> {
  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: env.EMAIL_ADMIN,
    subject,
    text,
  });
}
