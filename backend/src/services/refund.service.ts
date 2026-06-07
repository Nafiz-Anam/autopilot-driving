import prisma from '../client';
import settingsService from './settings.service';
import { createStripeClient } from '../utils/stripeClient';

/**
 * Issues a full Stripe refund for a booking and marks it REFUNDED.
 * Also restores gift voucher balance if one was applied.
 *
 * Returns { refunded: true } on success, { refunded: false, reason } if skipped/failed.
 */
async function issueRefundForBooking(bookingId: string): Promise<
  | { refunded: true; stripeRefundId: string }
  | { refunded: false; reason: string }
> {
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      paymentStatus: string;
      stripePaymentId: string | null;
      voucherCode: string | null;
      discountAmount: string | null;
    }>
  >(
    `SELECT id, "paymentStatus", "stripePaymentId", "voucherCode", "discountAmount"::text
     FROM "Booking" WHERE id = $1 LIMIT 1`,
    bookingId
  );

  const booking = rows[0];
  if (!booking) {
    return { refunded: false, reason: 'Booking not found' };
  }
  if (booking.paymentStatus === 'REFUNDED') {
    return { refunded: false, reason: 'Already refunded' };
  }
  if (booking.paymentStatus !== 'PAID') {
    return { refunded: false, reason: 'Booking was not paid — nothing to refund' };
  }

  // Fully-discounted bookings (£0 charged via voucher/coupon) have no Stripe payment to refund
  if (!booking.stripePaymentId) {
    await prisma.$executeRawUnsafe(
      `UPDATE "Booking" SET "paymentStatus" = 'REFUNDED', "updatedAt" = NOW() WHERE id = $1`,
      bookingId
    );
    await restoreVoucherBalance(booking.voucherCode, booking.discountAmount);
    return { refunded: true, stripeRefundId: 'free_booking' };
  }

  const secretKey = await settingsService.getStripeSecretKey();
  if (!secretKey) {
    return { refunded: false, reason: 'Payment gateway not configured' };
  }

  const stripe = createStripeClient(secretKey);

  const refund = await stripe.refunds.create({
    payment_intent: booking.stripePaymentId,
    reason: 'requested_by_customer',
  });

  await prisma.$executeRawUnsafe(
    `UPDATE "Booking" SET "paymentStatus" = 'REFUNDED', "updatedAt" = NOW() WHERE id = $1`,
    bookingId
  );

  await restoreVoucherBalance(booking.voucherCode, booking.discountAmount);

  return { refunded: true, stripeRefundId: refund.id };
}

async function restoreVoucherBalance(
  voucherCode: string | null,
  discountAmount: string | null
): Promise<void> {
  if (!voucherCode || !discountAmount) return;
  const discount = parseFloat(discountAmount);
  if (!Number.isFinite(discount) || discount <= 0) return;

  const vrows = await prisma.$queryRawUnsafe<Array<{ balance: string }>>(
    `SELECT balance::text FROM "GiftVoucher" WHERE code = $1 LIMIT 1`,
    voucherCode
  );
  const voucher = vrows[0];
  if (!voucher) return;

  const restoredBalance = Number(voucher.balance) + discount;
  await prisma.$executeRawUnsafe(
    `UPDATE "GiftVoucher" SET balance = $2::decimal, "isRedeemed" = false WHERE code = $1`,
    voucherCode,
    restoredBalance.toFixed(2)
  );
}

export default { issueRefundForBooking };
