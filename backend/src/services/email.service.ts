import nodemailer from 'nodemailer';
import config from '../config/config';
import logger from '../config/logger';
import settingsService from './settings.service';

let transporter: nodemailer.Transporter | null = null;
let emailServiceStatus = 'unknown';

const BRAND = {
  name: 'AutoPilot Driving School',
  primary: '#E8200A',
  accent: '#FF5500',
  text: '#111827',
  muted: '#6B7280',
  bg: '#F9FAFB',
  card: '#FFFFFF',
  border: '#E5E7EB',
};

const escapeHtml = (value: string): string =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderEmailLayout = (params: {
  title: string;
  intro: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footnote?: string;
}) => {
  const cta =
    params.ctaLabel && params.ctaUrl
      ? `<p style="margin: 24px 0 16px;">
          <a href="${params.ctaUrl}" style="background:${BRAND.primary};color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;display:inline-block;">${escapeHtml(params.ctaLabel)}</a>
        </p>`
      : '';

  return `<!doctype html>
<html>
  <body style="margin:0;background:${BRAND.bg};font-family:Arial,sans-serif;color:${BRAND.text};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width:620px;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:14px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,${BRAND.primary},${BRAND.accent});padding:18px 24px;color:#fff;font-weight:800;font-size:18px;">
                ${BRAND.name}
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h2 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:${BRAND.text};">${escapeHtml(params.title)}</h2>
                <p style="margin:0 0 16px;color:${BRAND.muted};font-size:14px;line-height:1.6;">${escapeHtml(params.intro)}</p>
                <div style="font-size:14px;line-height:1.7;color:${BRAND.text};">${params.bodyHtml}</div>
                ${cta}
                <p style="margin:20px 0 0;color:${BRAND.muted};font-size:12px;line-height:1.6;">
                  ${escapeHtml(params.footnote ?? 'If you did not expect this email, you can safely ignore it.')}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const getMailerConfig = async () => {
  const db = await settingsService.getSmtpConfig();
  const host = db.host || config.email.smtp.host;
  const port = db.port || config.email.smtp.port;
  const user = db.user || config.email.smtp.auth.user;
  const pass = db.pass || config.email.smtp.auth.pass;
  const from = db.from || config.email.from;
  return { host, port, user, pass, from };
};

const getTransporter = async (): Promise<{ transporter: nodemailer.Transporter; from: string }> => {
  const mailer = await getMailerConfig();
  if (!mailer.host || !mailer.user || !mailer.pass) {
    throw new Error('SMTP is not configured');
  }
  transporter = nodemailer.createTransport({
    host: mailer.host,
    port: mailer.port,
    secure: mailer.port === 465,
    auth: { user: mailer.user, pass: mailer.pass },
  });
  return { transporter, from: mailer.from };
};

/**
 * Check email service health
 * @returns {Promise<Object>} Email service status
 */
const checkEmailServiceHealth = async () => {
  try {
    const mailer = await getMailerConfig();
    if (!mailer.host || !mailer.user || !mailer.pass) {
      return {
        status: 'error',
        message: 'SMTP is not configured in settings',
        host: mailer.host,
        port: mailer.port,
        user: mailer.user,
      };
    }
    const localTransporter = nodemailer.createTransport({
      host: mailer.host,
      port: mailer.port,
      secure: mailer.port === 465,
      auth: { user: mailer.user, pass: mailer.pass },
    });
    await new Promise((resolve, reject) => {
      localTransporter.verify((error, success) => {
        if (error) {
          reject(error);
        } else {
          resolve(success);
        }
      });
    });

    return {
      status: 'connected',
      message: 'Email service is healthy',
      host: mailer.host,
      port: mailer.port,
      user: mailer.user,
    };
  } catch (error) {
    emailServiceStatus = 'error';
    return {
      status: 'error',
      message: error.message,
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      user: config.email.smtp.auth.user,
    };
  }
};

/**
 * Send email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @param {string} html
 * @returns {Promise}
 */
const sendEmail = async (to: string, subject: string, text: string, html: string) => {
  try {
    const mail = await getTransporter();
    const msg = { from: mail.from, to, subject, text, html };
    const result = await mail.transporter.sendMail(msg);
    emailServiceStatus = 'connected';
    logger.info(`Email sent successfully to ${to}`, {
      messageId: result.messageId,
      subject,
      response: result.response,
    });
    return result;
  } catch (error) {
    logger.error('Failed to send email', {
      to,
      subject,
      error: error.message,
      emailServiceStatus,
    });
    throw error;
  }
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @param {string} name
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to: string, token: string, name: string) => {
  const resetPasswordUrl = `${config.clientUrl || 'http://localhost:8008'}/reset-password?token=${token}`;
  const subject = 'Reset your password';
  const text = `Hi ${name},\nUse this link to reset your password: ${resetPasswordUrl}\nThis link expires soon.`;
  const html = renderEmailLayout({
    title: 'Reset your password',
    intro: `Hi ${name}, we received a request to reset your password.`,
    bodyHtml:
      '<p>Click the button below to choose a new password. For your security, this link expires shortly.</p>',
    ctaLabel: 'Reset Password',
    ctaUrl: resetPasswordUrl,
  });
  await sendEmail(to, subject, text, html);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @param {string} name
 * @returns {Promise}
 */
const sendVerificationEmail = async (to: string, token: string, name: string) => {
  const verificationEmailUrl = `${config.clientUrl || 'http://localhost:8008'}/verify-email?token=${token}`;
  const subject = 'Email Verification';
  const text = `Hi ${name},\nPlease verify your email using this link: ${verificationEmailUrl}`;
  const html = renderEmailLayout({
    title: 'Verify your email',
    intro: `Hi ${name}, welcome to ${BRAND.name}.`,
    bodyHtml: '<p>Please confirm your email address to activate your account.</p>',
    ctaLabel: 'Verify Email',
    ctaUrl: verificationEmailUrl,
  });
  await sendEmail(to, subject, text, html);
};

/**
 * Send welcome email
 * @param {string} to
 * @param {string} name
 * @returns {Promise}
 */
const sendWelcomeEmail = async (to: string, name: string) => {
  const subject = `Welcome to ${BRAND.name}`;
  const text = `Hi ${name}, welcome to ${BRAND.name}.`;
  const html = renderEmailLayout({
    title: 'Welcome aboard',
    intro: `Hi ${name}, thanks for joining ${BRAND.name}.`,
    bodyHtml: '<p>Your account is ready. You can now book lessons and manage your progress from your dashboard.</p>',
  });
  await sendEmail(to, subject, text, html);
};

/**
 * Send login alert email
 * @param {string} to
 * @param {Object} loginData
 * @returns {Promise}
 */
const sendLoginAlertEmail = async (
  to: string,
  loginData: {
    deviceName: string;
    location?: string;
    ipAddress?: string;
    browser?: string;
    os?: string;
  }
) => {
  const subject = 'New Login Detected';
  const text = `A new login was detected on your account.
Device: ${loginData.deviceName}
${loginData.location ? `Location: ${loginData.location}` : ''}
${loginData.ipAddress ? `IP Address: ${loginData.ipAddress}` : ''}
${loginData.browser ? `Browser: ${loginData.browser}` : ''}
${loginData.os ? `OS: ${loginData.os}` : ''}

If this wasn't you, please secure your account immediately.`;

  const html = renderEmailLayout({
    title: 'New login detected',
    intro: 'A new login was detected on your account.',
    bodyHtml: `
      <p><strong>Device:</strong> ${escapeHtml(loginData.deviceName)}</p>
      ${loginData.location ? `<p><strong>Location:</strong> ${escapeHtml(loginData.location)}</p>` : ''}
      ${loginData.ipAddress ? `<p><strong>IP Address:</strong> ${escapeHtml(loginData.ipAddress)}</p>` : ''}
      ${loginData.browser ? `<p><strong>Browser:</strong> ${escapeHtml(loginData.browser)}</p>` : ''}
      ${loginData.os ? `<p><strong>OS:</strong> ${escapeHtml(loginData.os)}</p>` : ''}
    `,
  });

  await sendEmail(to, subject, text, html);
};

/**
 * Send account lockout email
 * @param {string} to
 * @param {string} name
 * @param {Object} lockoutData
 * @returns {Promise}
 */
const sendAccountLockoutEmail = async (
  to: string,
  name: string,
  lockoutData: {
    reason: string;
    lockoutUntil?: Date;
    failedAttempts: number;
  }
) => {
  const subject = 'Account Locked';
  const text = `Dear ${name},
Your account has been locked due to ${lockoutData.reason}.
Failed login attempts: ${lockoutData.failedAttempts}
${lockoutData.lockoutUntil ? `Lockout until: ${lockoutData.lockoutUntil}` : ''}

Please contact support if you need assistance.`;

  const html = renderEmailLayout({
    title: 'Account locked',
    intro: `Hi ${name}, your account has been locked for security reasons.`,
    bodyHtml: `
      <p><strong>Reason:</strong> ${escapeHtml(lockoutData.reason)}</p>
      <p><strong>Failed attempts:</strong> ${lockoutData.failedAttempts}</p>
      ${lockoutData.lockoutUntil ? `<p><strong>Lockout until:</strong> ${lockoutData.lockoutUntil.toISOString()}</p>` : ''}
    `,
  });

  await sendEmail(to, subject, text, html);
};

/**
 * Send security update email
 * @param {string} to
 * @param {Object} data
 * @returns {Promise}
 */
const sendSecurityUpdateEmail = async (to: string, data: { title: string; message: string }) => {
  const subject = data.title;
  const text = data.message;
  const html = renderEmailLayout({
    title: data.title,
    intro: 'Security update for your account.',
    bodyHtml: `<p>${escapeHtml(data.message)}</p>`,
  });
  await sendEmail(to, subject, text, html);
};

/**
 * Send password expiry email
 * @param {string} to
 * @param {Object} data
 * @returns {Promise}
 */
const sendPasswordExpiryEmail = async (to: string, data: { daysUntilExpiry: number }) => {
  const subject = 'Password Expiry Alert';
  const text = `Your password will expire in ${data.daysUntilExpiry} days. Please change it soon to maintain account security.`;
  const html = renderEmailLayout({
    title: 'Password expiry alert',
    intro: 'Your password is approaching expiry.',
    bodyHtml: `<p>Your password will expire in <strong>${data.daysUntilExpiry} days</strong>. Please update it soon.</p>`,
  });
  await sendEmail(to, subject, text, html);
};

/**
 * Send suspicious activity email
 * @param {string} to
 * @param {Object} data
 * @returns {Promise}
 */
const sendSuspiciousActivityEmail = async (
  to: string,
  data: { activity: string; location: string }
) => {
  const subject = 'Suspicious Activity Detected';
  const text = `Suspicious activity detected: ${data.activity} from ${data.location}. If this wasn't you, please secure your account immediately.`;
  const html = renderEmailLayout({
    title: 'Suspicious activity detected',
    intro: 'We noticed unusual activity on your account.',
    bodyHtml: `<p><strong>Activity:</strong> ${escapeHtml(data.activity)}</p><p><strong>Location:</strong> ${escapeHtml(data.location)}</p>`,
  });
  await sendEmail(to, subject, text, html);
};

/**
 * Send password change email
 * @param {string} to
 * @param {string} name
 * @param {Object} data
 * @returns {Promise}
 */
const sendPasswordChangeEmail = async (
  to: string,
  name: string,
  data: {
    ipAddress: string;
    deviceName: string;
    timestamp: Date;
  }
) => {
  const subject = 'Password Changed';
  const text = `Dear ${name},
Your password has been successfully changed.
Device: ${data.deviceName}
IP Address: ${data.ipAddress}
Time: ${data.timestamp}

If this wasn't you, please secure your account immediately.`;

  const html = renderEmailLayout({
    title: 'Password changed',
    intro: `Hi ${name}, your password was changed successfully.`,
    bodyHtml: `
      <p><strong>Device:</strong> ${escapeHtml(data.deviceName)}</p>
      <p><strong>IP Address:</strong> ${escapeHtml(data.ipAddress)}</p>
      <p><strong>Time:</strong> ${data.timestamp.toISOString()}</p>
    `,
  });

  await sendEmail(to, subject, text, html);
};

/**
 * Send 2FA email
 * @param {string} to
 * @param {string} name
 * @param {Object} data
 * @returns {Promise}
 */
const sendTwoFactorEmail = async (to: string, name: string, data: { enabled: boolean }) => {
  const action = data.enabled ? 'enabled' : 'disabled';
  const subject = `Two-Factor Authentication ${data.enabled ? 'Enabled' : 'Disabled'}`;
  const text = `Dear ${name},
Two-factor authentication has been ${action} for your account.`;

  const html = renderEmailLayout({
    title: `Two-factor authentication ${data.enabled ? 'enabled' : 'disabled'}`,
    intro: `Hi ${name}, your two-factor authentication setting was updated.`,
    bodyHtml: `<p>2FA has been <strong>${action}</strong> on your account.</p>`,
  });

  await sendEmail(to, subject, text, html);
};

/**
 * Send device login email
 * @param {string} to
 * @param {string} name
 * @param {Object} data
 * @returns {Promise}
 */
const sendDeviceLoginEmail = async (
  to: string,
  name: string,
  data: {
    deviceName: string;
    ipAddress: string;
    location?: string;
    browser?: string;
    os?: string;
  }
) => {
  const subject = 'New Device Login';
  const text = `Dear ${name},
A new device has logged into your account.
Device: ${data.deviceName}
IP Address: ${data.ipAddress}
${data.location ? `Location: ${data.location}` : ''}
${data.browser ? `Browser: ${data.browser}` : ''}
${data.os ? `OS: ${data.os}` : ''}

If this wasn't you, please secure your account immediately.`;

  const html = renderEmailLayout({
    title: 'New device login',
    intro: `Hi ${name}, a new device signed in to your account.`,
    bodyHtml: `
      <p><strong>Device:</strong> ${escapeHtml(data.deviceName)}</p>
      <p><strong>IP Address:</strong> ${escapeHtml(data.ipAddress)}</p>
      ${data.location ? `<p><strong>Location:</strong> ${escapeHtml(data.location)}</p>` : ''}
      ${data.browser ? `<p><strong>Browser:</strong> ${escapeHtml(data.browser)}</p>` : ''}
      ${data.os ? `<p><strong>OS:</strong> ${escapeHtml(data.os)}</p>` : ''}
    `,
  });

  await sendEmail(to, subject, text, html);
};

/**
 * Send email verification OTP
 * @param {string} to
 * @param {string} otp
 * @param {string} name
 * @returns {Promise}
 */
export const sendEmailVerificationOtp = async (to: string, otp: string, name: string) => {
  const subject = 'Your Email Verification Code';
  const text = `Dear ${name},\nYour email verification code is: ${otp}\nThis code will expire in 5 minutes. If you did not create an account, please ignore this email.`;
  const html = renderEmailLayout({
    title: 'Email verification code',
    intro: `Hi ${name}, use the one-time code below to verify your email.`,
    bodyHtml: `<p style="font-size:26px;font-weight:800;letter-spacing:4px;color:${BRAND.primary};margin:10px 0 18px;">${escapeHtml(otp)}</p><p>This code expires in 5 minutes.</p>`,
  });
  await sendEmail(to, subject, text, html);
};

/**
 * Send password reset OTP
 * @param {string} to
 * @param {string} otp
 * @param {string} name
 * @returns {Promise}
 */
export const sendPasswordResetOtp = async (to: string, otp: string, name: string) => {
  const subject = 'Your Password Reset Code';
  const text = `Dear ${name},\nYour password reset code is: ${otp}\nThis code will expire in 5 minutes. If you did not request a password reset, please ignore this email.`;
  const html = renderEmailLayout({
    title: 'Password reset code',
    intro: `Hi ${name}, use this one-time code to reset your password.`,
    bodyHtml: `<p style="font-size:26px;font-weight:800;letter-spacing:4px;color:${BRAND.primary};margin:10px 0 18px;">${escapeHtml(otp)}</p><p>This code expires in 5 minutes.</p>`,
  });
  await sendEmail(to, subject, text, html);
};

/**
 * Send booking confirmation email with an iCal attachment.
 * Apple Mail, Outlook, and Gmail all show "Add to Calendar" inline.
 */
const sendBookingConfirmationEmail = async (params: {
  to: string;
  studentName: string;
  reference: string;
  lessonType: string;
  instructorName: string;
  scheduledAt: Date;
  durationMins: number;
  totalAmount: number;
  icsContent: string;
}) => {
  const dateStr = params.scheduledAt.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const timeStr = params.scheduledAt.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  });

  const subject = `Booking Confirmed — ${params.reference}`;
  const text = `Hi ${params.studentName},\n\nYour driving lesson is confirmed.\n\nReference: ${params.reference}\nDate: ${dateStr} at ${timeStr}\nInstructor: ${params.instructorName}\nDuration: ${params.durationMins / 60}hr\nAmount: £${params.totalAmount.toFixed(2)}\n\nThe attached .ics file will add this lesson to your calendar.`;

  const html = renderEmailLayout({
    title: 'Your lesson is confirmed!',
    intro: `Hi ${escapeHtml(params.studentName)}, your booking is all set.`,
    bodyHtml: `
      <table style="width:100%;border-collapse:collapse;margin:12px 0;">
        <tr><td style="padding:6px 0;color:#6B7280;width:40%;">Reference</td><td style="padding:6px 0;font-weight:700;">${escapeHtml(params.reference)}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Date</td><td style="padding:6px 0;">${escapeHtml(dateStr)}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Time</td><td style="padding:6px 0;">${escapeHtml(timeStr)}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Instructor</td><td style="padding:6px 0;">${escapeHtml(params.instructorName)}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Duration</td><td style="padding:6px 0;">${params.durationMins / 60}hr</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Amount paid</td><td style="padding:6px 0;font-weight:700;">£${params.totalAmount.toFixed(2)}</td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#6B7280;">The attached file will add this lesson to Apple Calendar, Google Calendar, or Outlook automatically.</p>
    `,
    footnote: 'To cancel or reschedule, please log in to your student dashboard.',
  });

  const mail = await getTransporter();
  await mail.transporter.sendMail({
    from: mail.from,
    to: params.to,
    subject,
    text,
    html,
    attachments: [
      {
        filename: `lesson-${params.reference}.ics`,
        content: params.icsContent,
        contentType: 'text/calendar; method=REQUEST; charset=utf-8',
      },
    ],
  });
};

const sendAdminNotificationEmail = async (
  subject: string,
  details: Record<string, string | number | boolean | null | undefined>
) => {
  const smtp = await settingsService.getSmtpConfig();
  const adminEmail = smtp.adminEmail;
  if (!adminEmail) return;
  const lines = Object.entries(details)
    .map(([k, v]) => `<p style="margin:4px 0;"><strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(v ?? ''))}</p>`)
    .join('');
  const text = Object.entries(details)
    .map(([k, v]) => `${k}: ${String(v ?? '')}`)
    .join('\n');
  const html = renderEmailLayout({
    title: subject,
    intro: 'A new event requires attention in the admin dashboard.',
    bodyHtml: lines,
  });
  await sendEmail(adminEmail, subject, text, html);
};

/**
 * Verify SMTP connection at startup
 */
export const verifySmtpConnection = async () => {
  try {
    const mail = await getTransporter();
    await mail.transporter.verify();
    logger.info('SMTP server is reachable and ready to send emails.');
  } catch (error) {
    logger.error('SMTP server is NOT reachable:', error);
    // Don't re-throw - this is just a warning, not a critical error
  }
};

export default {
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendLoginAlertEmail,
  sendAccountLockoutEmail,
  sendSecurityUpdateEmail,
  sendPasswordExpiryEmail,
  sendSuspiciousActivityEmail,
  sendDeviceLoginEmail,
  sendPasswordChangeEmail,
  sendTwoFactorEmail,
  sendEmailVerificationOtp,
  sendPasswordResetOtp,
  sendAdminNotificationEmail,
  sendBookingConfirmationEmail,
  verifySmtpConnection,
  checkEmailServiceHealth,
  transporter,
};
