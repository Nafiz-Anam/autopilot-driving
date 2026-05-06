import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { getSmtpSettings } from "@/lib/settings";

interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailOptions): Promise<void> {
  const smtp = await getSmtpSettings();
  if (!smtp.smtp_host || !smtp.smtp_user || !smtp.smtp_pass || !smtp.email_from) {
    throw new Error("SMTP settings are not configured in admin panel");
  }

  const transporter = nodemailer.createTransport({
    host: smtp.smtp_host,
    port: smtp.smtp_port,
    secure: smtp.smtp_port === 465,
    auth: {
      user: smtp.smtp_user,
      pass: smtp.smtp_pass,
    },
  });

  const html = await render(react);
  await transporter.sendMail({
    from: smtp.email_from,
    to,
    subject,
    html,
  });
}

export async function sendAdminNotification(subject: string, text: string): Promise<void> {
  const smtp = await getSmtpSettings();
  if (!smtp.smtp_host || !smtp.smtp_user || !smtp.smtp_pass || !smtp.email_from || !smtp.email_admin) {
    throw new Error("SMTP settings are not configured in admin panel");
  }

  const transporter = nodemailer.createTransport({
    host: smtp.smtp_host,
    port: smtp.smtp_port,
    secure: smtp.smtp_port === 465,
    auth: {
      user: smtp.smtp_user,
      pass: smtp.smtp_pass,
    },
  });

  await transporter.sendMail({
    from: smtp.email_from,
    to: smtp.email_admin,
    subject,
    text,
  });
}
