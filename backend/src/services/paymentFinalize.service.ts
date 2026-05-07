import type Stripe from 'stripe';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../client';

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

  return { code: md.voucherCode };
}

async function markBookingUnpaidFromFailed(pi: Stripe.PaymentIntent): Promise<void> {
  const bookingId = pi.metadata.bookingId;
  if (!bookingId) return;
  await prisma.$executeRawUnsafe(
    `UPDATE "Booking" SET "paymentStatus" = 'UNPAID', "updatedAt" = NOW() WHERE id = $1`,
    bookingId
  );
}

export default {
  finalizeBookingFromSucceededPayment,
  finalizeGiftVoucherPurchaseFromPayment,
  markBookingUnpaidFromFailed,
};
