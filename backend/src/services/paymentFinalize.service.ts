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
        instructorUserId: string | null;
        instructorName: string | null;
        instructorEmail: string | null;
      }>
    >(
      `SELECT b.reference, b."lessonType", b."scheduledAt", b."durationMins", b."totalAmount"::text,
              b."studentId",
              su.name AS "studentName", su.email AS "studentEmail",
              iu.id AS "instructorUserId",
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

      // Auto-add to Google Calendar for BOTH student + instructor (silent no-op if disconnected)
      googleCalendarService
        .broadcastBookingCreated({
          studentId: row.studentId,
          instructorUserId: row.instructorUserId,
          bookingId,
          reference: row.reference,
          lessonType: row.lessonType,
          studentName: row.studentName ?? 'Student',
          instructorName: row.instructorName ?? 'Autopilot Instructor',
          scheduledAt: new Date(row.scheduledAt),
          durationMins: row.durationMins,
        })
        .catch(() => {
          /* non-critical */
        });

      // Notify instructor of new booking (fire-and-forget)
      if (row.instructorEmail) {
        emailService
          .sendInstructorNewBookingEmail({
            to: row.instructorEmail,
            instructorName: row.instructorName ?? 'Instructor',
            studentName: row.studentName ?? 'Student',
            reference: row.reference,
            lessonType: row.lessonType,
            scheduledAt: new Date(row.scheduledAt),
            durationMins: row.durationMins,
          })
          .catch(() => {});
      }
    }
  } catch {
    // Email/calendar failure must not break payment finalization
  }

  // Voucher balance and coupon redemptionCount were already reserved atomically
  // at PaymentIntent creation time — no deduction needed here.
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

  // Send purchase confirmation to the buyer, then voucher delivery to recipient (fire-and-forget)
  void (async () => {
    try {
      const msg = md.message && md.message.length > 0 ? md.message : undefined;
      if (md.senderEmail) {
        await emailService.sendGiftVoucherConfirmationEmail({
          to: md.senderEmail,
          senderName: md.senderName ?? 'Someone',
          recipientName: md.recipientName ?? 'Friend',
          recipientEmail: md.recipientEmail,
          code: md.voucherCode,
          amount: amountGbp,
          message: msg,
        });
      }
      await emailService.sendGiftVoucherRecipientEmail({
        to: md.recipientEmail,
        recipientName: md.recipientName ?? 'Friend',
        senderName: md.senderName ?? 'Someone',
        code: md.voucherCode,
        amount: amountGbp,
        message: msg,
      });
    } catch {
      /* non-critical */
    }
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

  // Restore the voucher/coupon that was reserved at PI creation
  await restorePromoFromMetadata(pi.metadata);

  // Notify student of payment failure (fire-and-forget)
  void (async () => {
    try {
      const rows = await prisma.$queryRawUnsafe<
        Array<{
          reference: string;
          lessonType: string;
          scheduledAt: Date;
          totalAmount: string;
          studentName: string | null;
          studentEmail: string;
        }>
      >(
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
    } catch {
      /* non-critical */
    }
  })();
}

async function restorePromoFromMetadata(metadata: Stripe.Metadata): Promise<void> {
  const vCode =
    metadata.voucherCode && metadata.voucherCode.length > 0 ? metadata.voucherCode : null;
  const cCode = metadata.couponCode && metadata.couponCode.length > 0 ? metadata.couponCode : null;
  const discount = metadata.discountAmount ? parseFloat(metadata.discountAmount) : 0;

  if (vCode && discount > 0) {
    await prisma.$executeRawUnsafe(
      `UPDATE "GiftVoucher" SET balance = balance + $2::decimal, "isRedeemed" = false WHERE code = $1`,
      vCode,
      discount.toFixed(2)
    );
  } else if (cCode) {
    await prisma.$executeRawUnsafe(
      `UPDATE "Coupon"
       SET "redemptionCount" = GREATEST(0, "redemptionCount" - 1), "updatedAt" = NOW()
       WHERE code = $1`,
      cCode
    );
  }
}

export default {
  finalizeBookingFromSucceededPayment,
  finalizeGiftVoucherPurchaseFromPayment,
  markBookingUnpaidFromFailed,
  restorePromoFromMetadata,
};
