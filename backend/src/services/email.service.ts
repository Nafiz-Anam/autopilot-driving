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
// sendWelcomeEmail is defined below with the full branded template

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

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function detailRow(label: string, value: string) {
  return `<tr><td style="padding:5px 0;color:#6B7280;width:42%;">${escapeHtml(label)}</td><td style="padding:5px 0;font-weight:600;">${escapeHtml(value)}</td></tr>`;
}
function detailTable(rows: [string, string][]) {
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0;">${rows.map(([l, v]) => detailRow(l, v)).join('')}</table>`;
}

// ── Booking cancellation — student ─────────────────────────────────────────────
const sendBookingCancellationEmail = async (params: {
  to: string;
  studentName: string;
  reference: string;
  lessonType: string;
  scheduledAt: Date;
  refunded: boolean;
  refundAmount?: number;
}) => {
  const subject = `Booking Cancelled — ${params.reference}`;
  const refundNote = params.refunded && params.refundAmount
    ? `A full refund of <strong>£${params.refundAmount.toFixed(2)}</strong> has been issued and will appear in your account within 5–10 business days.`
    : 'As the lesson was within 24 hours, no refund has been issued in line with our cancellation policy.';

  const html = renderEmailLayout({
    title: 'Your booking has been cancelled',
    intro: `Hi ${escapeHtml(params.studentName)}, your lesson has been cancelled as requested.`,
    bodyHtml: `
      ${detailTable([
        ['Reference', params.reference],
        ['Lesson Type', params.lessonType],
        ['Was Scheduled', `${fmtDate(params.scheduledAt)} at ${fmtTime(params.scheduledAt)}`],
      ])}
      <p style="margin:12px 0;padding:12px;background:${params.refunded ? '#f0fdf4' : '#fef2f2'};border-radius:8px;font-size:13px;">${refundNote}</p>
    `,
    ctaLabel: 'Book Another Lesson',
    ctaUrl: 'https://autopilotdrivingschool.co.uk/booking',
    footnote: 'Questions? Contact us at contact@autopilotdrivingschool.co.uk',
  });
  await sendEmail(params.to, subject, subject, html);
};

// ── Booking cancellation — instructor ──────────────────────────────────────────
const sendInstructorBookingCancellationEmail = async (params: {
  to: string;
  instructorName: string;
  studentName: string;
  reference: string;
  scheduledAt: Date;
  reason: string;
}) => {
  const subject = `Lesson Cancelled — ${params.reference}`;
  const html = renderEmailLayout({
    title: 'A lesson has been cancelled',
    intro: `Hi ${escapeHtml(params.instructorName)}, a student has cancelled their upcoming lesson.`,
    bodyHtml: `
      ${detailTable([
        ['Reference', params.reference],
        ['Student', params.studentName],
        ['Was Scheduled', `${fmtDate(params.scheduledAt)} at ${fmtTime(params.scheduledAt)}`],
        ['Reason', params.reason],
      ])}
      <p style="margin:12px 0;font-size:13px;color:#6B7280;">This slot is now free in your calendar.</p>
    `,
    ctaLabel: 'View Dashboard',
    ctaUrl: 'https://autopilotdrivingschool.co.uk/instructor/dashboard',
    footnote: 'You will receive this notification for every cancellation.',
  });
  await sendEmail(params.to, subject, subject, html);
};

// ── New booking assigned — instructor ──────────────────────────────────────────
const sendInstructorNewBookingEmail = async (params: {
  to: string;
  instructorName: string;
  studentName: string;
  reference: string;
  lessonType: string;
  scheduledAt: Date;
  durationMins: number;
}) => {
  const subject = `New Lesson Booked — ${params.reference}`;
  const html = renderEmailLayout({
    title: 'You have a new lesson!',
    intro: `Hi ${escapeHtml(params.instructorName)}, a new lesson has been assigned to you.`,
    bodyHtml: detailTable([
      ['Reference', params.reference],
      ['Student', params.studentName],
      ['Lesson Type', params.lessonType],
      ['Date', fmtDate(params.scheduledAt)],
      ['Time', fmtTime(params.scheduledAt)],
      ['Duration', `${params.durationMins / 60}hr`],
    ]),
    ctaLabel: 'View Schedule',
    ctaUrl: 'https://autopilotdrivingschool.co.uk/instructor/schedule',
    footnote: 'You will receive this notification for every new booking.',
  });
  await sendEmail(params.to, subject, subject, html);
};

// ── Reschedule request — notify the other party ────────────────────────────────
const sendRescheduleRequestEmail = async (params: {
  to: string;
  recipientName: string;
  requesterName: string;
  requesterRole: 'student' | 'instructor';
  reference: string;
  currentDate: Date;
  proposedDate: Date;
  reason: string;
}) => {
  const subject = `Reschedule Request — ${params.reference}`;
  const html = renderEmailLayout({
    title: 'A reschedule has been requested',
    intro: `Hi ${escapeHtml(params.recipientName)}, ${escapeHtml(params.requesterName)} has requested to reschedule a lesson.`,
    bodyHtml: `
      ${detailTable([
        ['Reference', params.reference],
        ['Current Date', `${fmtDate(params.currentDate)} at ${fmtTime(params.currentDate)}`],
        ['Proposed Date', `${fmtDate(params.proposedDate)} at ${fmtTime(params.proposedDate)}`],
        ['Reason', params.reason],
      ])}
      <p style="margin:12px 0;font-size:13px;color:#6B7280;">Please log in to accept or decline this request.</p>
    `,
    ctaLabel: 'Review Request',
    ctaUrl: params.requesterRole === 'student'
      ? 'https://autopilotdrivingschool.co.uk/instructor/bookings'
      : 'https://autopilotdrivingschool.co.uk/student/bookings',
    footnote: 'If you have questions, contact us at contact@autopilotdrivingschool.co.uk',
  });
  await sendEmail(params.to, subject, subject, html);
};

// ── Reschedule accepted ────────────────────────────────────────────────────────
const sendRescheduleAcceptedEmail = async (params: {
  to: string;
  recipientName: string;
  reference: string;
  newDate: Date;
  instructorName: string;
  durationMins: number;
  icsContent?: string;
}) => {
  const subject = `Reschedule Confirmed — ${params.reference}`;
  const html = renderEmailLayout({
    title: 'Your reschedule has been accepted',
    intro: `Hi ${escapeHtml(params.recipientName)}, your lesson has been moved to the new time.`,
    bodyHtml: detailTable([
      ['Reference', params.reference],
      ['New Date', fmtDate(params.newDate)],
      ['New Time', fmtTime(params.newDate)],
      ['Instructor', params.instructorName],
      ['Duration', `${params.durationMins / 60}hr`],
    ]),
    ctaLabel: 'View Bookings',
    ctaUrl: 'https://autopilotdrivingschool.co.uk/student/bookings',
    footnote: params.icsContent ? 'The attached file will update your calendar automatically.' : undefined,
  });
  const mail = await getTransporter();
  await mail.transporter.sendMail({
    from: mail.from,
    to: params.to,
    subject,
    text: subject,
    html,
    ...(params.icsContent ? {
      attachments: [{
        filename: `lesson-${params.reference}-updated.ics`,
        content: params.icsContent,
        contentType: 'text/calendar; method=REQUEST; charset=utf-8',
      }],
    } : {}),
  });
};

// ── Reschedule declined ────────────────────────────────────────────────────────
const sendRescheduleDeclinedEmail = async (params: {
  to: string;
  recipientName: string;
  reference: string;
  originalDate: Date;
}) => {
  const subject = `Reschedule Declined — ${params.reference}`;
  const html = renderEmailLayout({
    title: 'Reschedule request declined',
    intro: `Hi ${escapeHtml(params.recipientName)}, unfortunately your reschedule request has been declined.`,
    bodyHtml: `
      ${detailTable([
        ['Reference', params.reference],
        ['Original Date', `${fmtDate(params.originalDate)} at ${fmtTime(params.originalDate)}`],
      ])}
      <p style="margin:12px 0;font-size:13px;color:#6B7280;">Your original lesson time remains unchanged. If you need to cancel, please do so from your dashboard.</p>
    `,
    ctaLabel: 'View Bookings',
    ctaUrl: 'https://autopilotdrivingschool.co.uk/student/bookings',
    footnote: 'Questions? Contact us at contact@autopilotdrivingschool.co.uk',
  });
  await sendEmail(params.to, subject, subject, html);
};

// ── Payment failed ─────────────────────────────────────────────────────────────
const sendPaymentFailedEmail = async (params: {
  to: string;
  studentName: string;
  reference: string;
  lessonType: string;
  scheduledAt: Date;
  amount: number;
}) => {
  const subject = `Payment Failed — ${params.reference}`;
  const html = renderEmailLayout({
    title: 'Your payment was unsuccessful',
    intro: `Hi ${escapeHtml(params.studentName)}, we were unable to process your payment for the following lesson.`,
    bodyHtml: `
      ${detailTable([
        ['Reference', params.reference],
        ['Lesson', params.lessonType],
        ['Date', `${fmtDate(params.scheduledAt)} at ${fmtTime(params.scheduledAt)}`],
        ['Amount', `£${params.amount.toFixed(2)}`],
      ])}
      <p style="margin:12px 0;padding:12px;background:#fef2f2;border-radius:8px;font-size:13px;">Please update your payment details and try again. Your booking will be held for a short time before being released.</p>
    `,
    ctaLabel: 'Retry Payment',
    ctaUrl: 'https://autopilotdrivingschool.co.uk/student/bookings',
    footnote: 'If you continue to have issues, contact us at contact@autopilotdrivingschool.co.uk',
  });
  await sendEmail(params.to, subject, subject, html);
};

// ── Refund confirmation ────────────────────────────────────────────────────────
const sendRefundConfirmationEmail = async (params: {
  to: string;
  studentName: string;
  reference: string;
  refundAmount: number;
  scheduledAt: Date;
}) => {
  const subject = `Refund Processed — ${params.reference}`;
  const html = renderEmailLayout({
    title: 'Your refund is on its way',
    intro: `Hi ${escapeHtml(params.studentName)}, your refund has been processed successfully.`,
    bodyHtml: `
      ${detailTable([
        ['Reference', params.reference],
        ['Refund Amount', `£${params.refundAmount.toFixed(2)}`],
        ['Cancelled Lesson', `${fmtDate(params.scheduledAt)} at ${fmtTime(params.scheduledAt)}`],
      ])}
      <p style="margin:12px 0;font-size:13px;color:#6B7280;">Refunds typically appear within 5–10 business days depending on your bank or card provider.</p>
    `,
    ctaLabel: 'Book Another Lesson',
    ctaUrl: 'https://autopilotdrivingschool.co.uk/booking',
    footnote: 'Questions about your refund? Contact us at contact@autopilotdrivingschool.co.uk',
  });
  await sendEmail(params.to, subject, subject, html);
};

// ── Gift voucher — purchaser confirmation ──────────────────────────────────────
const sendGiftVoucherConfirmationEmail = async (params: {
  to: string;
  senderName: string;
  recipientName: string;
  recipientEmail: string;
  code: string;
  amount: number;
  message?: string;
}) => {
  const subject = 'Gift Voucher Purchase Confirmed';
  const html = renderEmailLayout({
    title: 'Your gift voucher is ready!',
    intro: `Hi ${escapeHtml(params.senderName)}, your gift voucher for ${escapeHtml(params.recipientName)} has been purchased successfully.`,
    bodyHtml: `
      ${detailTable([
        ['Voucher Code', params.code],
        ['Amount', `£${params.amount.toFixed(2)}`],
        ['For', params.recipientName],
        ['Sent To', params.recipientEmail],
        ...(params.message ? [['Message', params.message] as [string, string]] : []),
      ])}
      <p style="margin:12px 0;font-size:13px;color:#6B7280;">The voucher has been sent to ${escapeHtml(params.recipientName)} at ${escapeHtml(params.recipientEmail)}. It is valid for 12 months from today.</p>
    `,
    footnote: 'Questions? Contact us at contact@autopilotdrivingschool.co.uk',
  });
  await sendEmail(params.to, subject, subject, html);
};

// ── Gift voucher — recipient delivery ─────────────────────────────────────────
const sendGiftVoucherRecipientEmail = async (params: {
  to: string;
  recipientName: string;
  senderName: string;
  code: string;
  amount: number;
  message?: string;
}) => {
  const subject = `You've received a driving lesson gift from ${params.senderName}!`;
  const html = renderEmailLayout({
    title: `${escapeHtml(params.senderName)} gave you a driving lesson gift!`,
    intro: `Hi ${escapeHtml(params.recipientName)}, you've received a gift voucher for AutoPilot Driving School.`,
    bodyHtml: `
      ${params.message ? `<p style="margin:0 0 16px;padding:14px;background:#f9fafb;border-left:4px solid #E8200A;border-radius:4px;font-style:italic;">"${escapeHtml(params.message)}"<br><span style="font-style:normal;font-weight:600;">— ${escapeHtml(params.senderName)}</span></p>` : ''}
      <p style="margin:0 0 8px;font-size:13px;color:#6B7280;">Your voucher code:</p>
      <p style="margin:0 0 16px;font-size:28px;font-weight:800;letter-spacing:4px;color:#E8200A;">${escapeHtml(params.code)}</p>
      ${detailTable([['Value', `£${params.amount.toFixed(2)}`], ['Valid For', '12 months']])}
      <p style="margin:12px 0;font-size:13px;color:#6B7280;">Use this code when booking your lesson to redeem the full amount.</p>
    `,
    ctaLabel: 'Book Your Lesson',
    ctaUrl: 'https://autopilotdrivingschool.co.uk/booking',
    footnote: 'Questions? Contact us at contact@autopilotdrivingschool.co.uk',
  });
  await sendEmail(params.to, subject, subject, html);
};

// ── Instructor application received ───────────────────────────────────────────
const sendInstructorApplicationReceivedEmail = async (params: {
  to: string;
  applicantName: string;
  email: string;
}) => {
  const subject = 'We received your instructor application';
  const html = renderEmailLayout({
    title: 'Application received — thank you!',
    intro: `Hi ${escapeHtml(params.applicantName)}, we've received your application to join AutoPilot Driving School as an instructor.`,
    bodyHtml: `
      <p>Our team will review your application and get back to you within <strong>2–5 business days</strong>.</p>
      <p style="margin:12px 0;font-size:13px;color:#6B7280;">If you have any questions in the meantime, feel free to contact us at contact@autopilotdrivingschool.co.uk</p>
    `,
    footnote: 'You are receiving this because you submitted an instructor application on our website.',
  });
  await sendEmail(params.to, subject, subject, html);
};

// ── Instructor application approved ───────────────────────────────────────────
const sendInstructorApplicationApprovedEmail = async (params: {
  to: string;
  applicantName: string;
  passwordResetUrl: string | null;
  isExistingUser?: boolean;
}) => {
  const subject = 'Congratulations — Your Application Has Been Approved!';

  // Existing user gets a set-password link too, but framed as optional (they
  // may already remember their password). Fresh users see it as required
  // since we created their account with an unusable placeholder password.
  const setPasswordHtml = params.passwordResetUrl
    ? params.isExistingUser
      ? `
        <p>Your account is now upgraded to instructor. Use your existing password to log in. If you've forgotten it, use the link below to set a new one.</p>
        <p style="margin:12px 0;font-size:13px;color:#6B7280;">Password link expires in 7 days:</p>
        <p style="margin:12px 0;font-size:13px;">
          <a href="${escapeHtml(params.passwordResetUrl)}" style="color:#E00027;font-weight:600;">Set a new password</a>
        </p>
      `
      : `
        <p>Your instructor account has been created. To get started, set your password using the secure link below.</p>
        <p style="margin:12px 0;font-size:13px;color:#6B7280;">This link expires in 7 days. If it expires, contact us and we'll issue a new one.</p>
      `
    : `<p>Your instructor account has been created. Please contact us to set up your password.</p>`;

  const ctaLabel = params.isExistingUser ? 'Log In Now' : 'Set Your Password';
  const clientBase = 'https://autopilotdrivingschool.co.uk';
  const ctaUrl = params.isExistingUser
    ? `${clientBase}/login`
    : (params.passwordResetUrl ?? `${clientBase}/login`);

  const html = renderEmailLayout({
    title: 'Welcome to the Autopilot team!',
    intro: `Hi ${escapeHtml(params.applicantName)}, we're delighted to let you know your instructor application has been approved.`,
    bodyHtml: `
      ${setPasswordHtml}
      <p style="margin:12px 0;font-size:13px;color:#6B7280;">If you have any questions please reach out to us at info@autopilotdrivingschool.co.uk</p>
    `,
    ctaLabel,
    ctaUrl,
    footnote: 'Welcome aboard — we look forward to working with you!',
  });
  await sendEmail(params.to, subject, subject, html);
};

// ── Instructor application rejected ───────────────────────────────────────────
const sendInstructorApplicationRejectedEmail = async (params: {
  to: string;
  applicantName: string;
}) => {
  const subject = 'Your AutoPilot Instructor Application';
  const html = renderEmailLayout({
    title: 'Thank you for applying',
    intro: `Hi ${escapeHtml(params.applicantName)}, thank you for your interest in joining AutoPilot Driving School as an instructor.`,
    bodyHtml: `
      <p>After careful consideration, we are unable to move forward with your application at this time.</p>
      <p style="margin:12px 0;font-size:13px;color:#6B7280;">We appreciate the time you took to apply and encourage you to apply again in the future. If you have any questions, feel free to contact us at contact@autopilotdrivingschool.co.uk</p>
    `,
    footnote: 'We wish you all the best.',
  });
  await sendEmail(params.to, subject, subject, html);
};

// ── Contact form acknowledgement ───────────────────────────────────────────────
const sendContactAcknowledgementEmail = async (params: {
  to: string;
  name: string;
}) => {
  const subject = "We've received your message";
  const html = renderEmailLayout({
    title: "Thanks for getting in touch!",
    intro: `Hi ${escapeHtml(params.name)}, we've received your message and will get back to you as soon as possible.`,
    bodyHtml: `
      <p>Our team typically responds within <strong>1–2 business days</strong> (Mon–Fri, 8am–8pm).</p>
      <p style="margin:12px 0;font-size:13px;color:#6B7280;">If your enquiry is urgent, you can also reach us by phone at <a href="tel:07450556963" style="color:#E8200A;">07450 556 963</a>.</p>
    `,
    footnote: 'You are receiving this because you submitted a contact form on our website.',
  });
  await sendEmail(params.to, subject, subject, html);
};

// ── Welcome email ──────────────────────────────────────────────────────────────
const sendWelcomeEmail = async (params: { to: string; name: string }) => {
  const subject = 'Welcome to AutoPilot Driving School!';
  const html = renderEmailLayout({
    title: `Welcome, ${escapeHtml(params.name)}!`,
    intro: "You're all set. Here's how to get started with your driving lessons.",
    bodyHtml: `
      <ol style="margin:12px 0;padding-left:20px;line-height:2;">
        <li>Book your first lesson from the booking page</li>
        <li>Choose your preferred instructor and time slot</li>
        <li>Pay securely — your lesson is confirmed instantly</li>
        <li>Track your progress from your student dashboard</li>
      </ol>
    `,
    ctaLabel: 'Book Your First Lesson',
    ctaUrl: 'https://autopilotdrivingschool.co.uk/booking',
    footnote: 'Questions? We\'re here at contact@autopilotdrivingschool.co.uk or 07450 556 963.',
  });
  await sendEmail(params.to, subject, subject, html);
};

const sendAccountCreatedEmail = async (params: {
  to: string;
  name: string;
  password: string;
  role: 'student' | 'instructor';
}) => {
  const loginUrl = 'https://autopilotdrivingschool.co.uk/login';
  const subject = 'Your AutoPilot Driving School account is ready';
  const html = renderEmailLayout({
    title: `Welcome, ${escapeHtml(params.name)}!`,
    intro: `Your ${params.role} account has been created. Use the credentials below to log in.`,
    bodyHtml: `
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr>
          <td style="padding:10px 12px;background:#f8f8f8;border:1px solid #e5e5e5;font-weight:600;width:40%;">Email</td>
          <td style="padding:10px 12px;background:#fff;border:1px solid #e5e5e5;font-family:monospace;">${escapeHtml(params.to)}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;background:#f8f8f8;border:1px solid #e5e5e5;font-weight:600;">Temporary Password</td>
          <td style="padding:10px 12px;background:#fff;border:1px solid #e5e5e5;font-family:monospace;">${escapeHtml(params.password)}</td>
        </tr>
      </table>
      <p style="margin:12px 0;color:#666;font-size:13px;">Please change your password after your first login.</p>
    `,
    ctaLabel: 'Log In Now',
    ctaUrl: loginUrl,
    footnote: 'If you did not expect this email, contact us at contact@autopilotdrivingschool.co.uk',
  });
  const text = `Welcome ${params.name},\n\nYour account has been created.\nEmail: ${params.to}\nPassword: ${params.password}\n\nLog in at: ${loginUrl}\n\nPlease change your password after first login.`;
  await sendEmail(params.to, subject, text, html);
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
  // Booking lifecycle
  sendBookingCancellationEmail,
  sendInstructorBookingCancellationEmail,
  sendInstructorNewBookingEmail,
  // Reschedule
  sendRescheduleRequestEmail,
  sendRescheduleAcceptedEmail,
  sendRescheduleDeclinedEmail,
  // Payment
  sendPaymentFailedEmail,
  sendRefundConfirmationEmail,
  // Gift vouchers
  sendGiftVoucherConfirmationEmail,
  sendGiftVoucherRecipientEmail,
  // Instructor applications
  sendInstructorApplicationReceivedEmail,
  sendInstructorApplicationApprovedEmail,
  sendInstructorApplicationRejectedEmail,
  // Misc
  sendContactAcknowledgementEmail,
  sendAccountCreatedEmail,
  verifySmtpConnection,
  checkEmailServiceHealth,
  transporter,
};
