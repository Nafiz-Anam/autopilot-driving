import type Stripe from 'stripe';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../client';
import emailService from './email.service';
import icalService from './ical.service';
import googleCalendarService from './googleCalendar.service';

/**
 * Idempotent: marks booking paid / confirmed from a succeeded PaymentIntent.
 */
async function finalizeBookingFromSucceededPayment(pi: Stripe.PaymentIntent): Promise<void> {
  const { bookingId, voucherCode, couponCode, discountAmount } = pi.metadata;

  if (!bookingId) return;

  const d = discountAmount ? parseFloat(discountAmount) : 0;
  const vCode = voucherCode && voucherCode.length > 0 ? voucherCode : undefined;
  const cCode = couponCode && couponCode.length > 0 ? couponCode : undefined;

  const updatedRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `UPDATE "Booking"
     SET "paymentStatus" = 'PAID',
         status = 'CONFIRMED',
         "stripePaymentId" = $2,
         "voucherCode" = COALESCE($3, "voucherCode"),
         "couponCode" = COALESCE($4, "couponCode"),
         "discountAmount" = CASE WHEN $5::decimal > 0 THEN $5::decimal ELSE "discountAmount" END,
         "updatedAt" = NOW()
     WHERE id = $1 AND "paymentStatus" <> 'PAID'
     RETURNING id`,
    bookingId,
    pi.id,
    vCode ?? null,
    cCode ?? null,
    d > 0 ? d.toFixed(2) : '0'
  );

  if (!updatedRows.length) return;

  // Send confirmation email with .ics calendar attachment (fire-and-forget)
  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        reference: string;
        lessonType: string;
        scheduledAt: Date;
        durationMins: number;
        totalAmount: string;
        studentId: string;
        studentName: string | null;
        studentEmail: string;
        instructorName: string | null;
        instructorEmail: string | null;
      }>
    >(
      `SELECT b.reference, b."lessonType", b."scheduledAt", b."durationMins", b."totalAmount"::text,
              b."studentId",
              su.name AS "studentName", su.email AS "studentEmail",
              iu.name AS "instructorName", iu.email AS "instructorEmail"
       FROM "Booking" b
       INNER JOIN users su ON su.id = b."studentId"
       LEFT  JOIN "Instructor" i ON i.id = b."instructorId"
       LEFT  JOIN users iu ON iu.id = i."userId"
       WHERE b.id = $1 LIMIT 1`,
      bookingId
    );
    const row = rows[0];
    if (row) {
      const icsContent = icalService.generateBookingIcs({
        bookingId,
        reference: row.reference,
        studentName: row.studentName ?? 'Student',
        studentEmail: row.studentEmail,
        instructorName: row.instructorName ?? 'Your Instructor',
        lessonType: row.lessonType,
        scheduledAt: new Date(row.scheduledAt),
        durationMins: row.durationMins,
        totalAmount: Number(row.totalAmount),
      });
      await emailService.sendBookingConfirmationEmail({
        to: row.studentEmail,
        studentName: row.studentName ?? 'Student',
        reference: row.reference,
        lessonType: row.lessonType,
        instructorName: row.instructorName ?? 'Your Instructor',
        scheduledAt: new Date(row.scheduledAt),
        durationMins: row.durationMins,
        totalAmount: Number(row.totalAmount),
        icsContent,
      });

      // Auto-add to Google Calendar if student has connected their account
      googleCalendarService.createCalendarEvent(row.studentId, {
        bookingId,
        reference: row.reference,
        lessonType: row.lessonType,
        instructorName: row.instructorName ?? 'AutoPilot Instructor',
        scheduledAt: new Date(row.scheduledAt),
        durationMins: row.durationMins,
      }).catch(() => { /* non-critical */ });

      // Notify instructor of new booking (fire-and-forget)
      if (row.instructorEmail) {
        emailService.sendInstructorNewBookingEmail({
          to: row.instructorEmail,
          instructorName: row.instructorName ?? 'Instructor',
          studentName: row.studentName ?? 'Student',
          reference: row.reference,
          lessonType: row.lessonType,
          scheduledAt: new Date(row.scheduledAt),
          durationMins: row.durationMins,
        }).catch(() => {});
      }
    }
  } catch {
    // Email/calendar failure must not break payment finalization
  }

  if (vCode && d > 0) {
    const vrows = await prisma.$queryRawUnsafe<Array<{ balance: string }>>(
      `SELECT balance::text AS balance FROM "GiftVoucher" WHERE code = $1 LIMIT 1`,
      vCode
    );
    const voucher = vrows[0];
    if (voucher) {
      const newBalance = Math.max(0, Number(voucher.balance) - d);
      await prisma.$executeRawUnsafe(
        `UPDATE "GiftVoucher"
         SET balance = $2::decimal,
             "isRedeemed" = $3
         WHERE code = $1`,
        vCode,
        newBalance.toFixed(2),
        newBalance === 0
      );
    }
  } else if (cCode) {
    await prisma.$executeRawUnsafe(
      `UPDATE "Coupon" SET "redemptionCount" = "redemptionCount" + 1, "updatedAt" = NOW() WHERE code = $1`,
      cCode
    );
  }
}

async function finalizeGiftVoucherPurchaseFromPayment(
  pi: Stripe.PaymentIntent
): Promise<{ code: string } | null> {
  const md = pi.metadata;
  if (md.type !== 'gift_voucher' || !md.voucherCode) {
    return null;
  }

  const existing = await prisma.$queryRawUnsafe<Array<{ code: string }>>(
    `SELECT code FROM "GiftVoucher" WHERE "stripePaymentId" = $1 LIMIT 1`,
    pi.id
  );
  if (existing[0]) {
    return { code: existing[0].code };
  }

  const amountGbp = parseFloat(md.amountGbp ?? '0');
  if (!Number.isFinite(amountGbp) || amountGbp < 10) {
    return null;
  }

  const id = uuidv4();
  const expiresAt = moment().add(1, 'year').toDate();

  await prisma.$executeRawUnsafe(
    `INSERT INTO "GiftVoucher" (
      id, code, amount, balance, "isRedeemed", "senderName", "recipientName", "recipientEmail",
      message, "stripePaymentId", "expiresAt", "createdAt"
    ) VALUES (
      $1, $2, $3::decimal, $4::decimal, false, $5, $6, $7, $8, $9, $10::timestamp, NOW()
    )`,
    id,
    md.voucherCode,
    amountGbp.toFixed(2),
    amountGbp.toFixed(2),
    md.senderName ?? '—',
    md.recipientName ?? '—',
    md.recipientEmail ?? '',
    md.message && md.message.length > 0 ? md.message : null,
    pi.id,
    expiresAt.toISOString()
  );

  // Send voucher confirmation to purchaser + delivery to recipient (fire-and-forget)
  void (async () => {
    try {
      await emailService.sendGiftVoucherConfirmationEmail({
        to: md.recipientEmail,
        senderName: md.senderName ?? 'Someone',
        recipientName: md.recipientName ?? 'Friend',
        recipientEmail: md.recipientEmail,
        code: md.voucherCode,
        amount: amountGbp,
        message: md.message && md.message.length > 0 ? md.message : undefined,
      });
      await emailService.sendGiftVoucherRecipientEmail({
        to: md.recipientEmail,
        recipientName: md.recipientName ?? 'Friend',
        senderName: md.senderName ?? 'Someone',
        code: md.voucherCode,
        amount: amountGbp,
        message: md.message && md.message.length > 0 ? md.message : undefined,
      });
    } catch { /* non-critical */ }
  })();

  return { code: md.voucherCode };
}

async function markBookingUnpaidFromFailed(pi: Stripe.PaymentIntent): Promise<void> {
  const bookingId = pi.metadata.bookingId;
  if (!bookingId) return;
  await prisma.$executeRawUnsafe(
    `UPDATE "Booking" SET "paymentStatus" = 'UNPAID', "updatedAt" = NOW() WHERE id = $1`,
    bookingId
  );

  // Notify student of payment failure (fire-and-forget)
  void (async () => {
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{
        reference: string; lessonType: string; scheduledAt: Date;
        totalAmount: string; studentName: string | null; studentEmail: string;
      }>>(
        `SELECT b.reference, b."lessonType", b."scheduledAt", b."totalAmount"::text,
                su.name AS "studentName", su.email AS "studentEmail"
         FROM "Booking" b INNER JOIN users su ON su.id = b."studentId"
         WHERE b.id = $1 LIMIT 1`,
        bookingId
      );
      const row = rows[0];
      if (row) {
        await emailService.sendPaymentFailedEmail({
          to: row.studentEmail,
          studentName: row.studentName ?? 'Student',
          reference: row.reference,
          lessonType: row.lessonType,
          scheduledAt: new Date(row.scheduledAt),
          amount: Number(row.totalAmount),
        });
      }
    } catch { /* non-critical */ }
  })();
}

export default {
  finalizeBookingFromSucceededPayment,
  finalizeGiftVoucherPurchaseFromPayment,
  markBookingUnpaidFromFailed,
};
