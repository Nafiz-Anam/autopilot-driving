import prisma from '../client';
import settingsService from './settings.service';
import { createStripeClient } from '../utils/stripeClient';

/**
 * Issues a full Stripe refund for a booking and marks it REFUNDED.
 * Also restores gift voucher balance and coupon redemption count if applied.
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
      couponCode: string | null;
      discountAmount: string | null;
    }>
  >(
    `SELECT id, "paymentStatus", "stripePaymentId", "voucherCode", "couponCode", "discountAmount"::text
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

  // Fully-discounted bookings (£0 charged) have no Stripe payment to refund
  if (!booking.stripePaymentId) {
    await prisma.$executeRawUnsafe(
      `UPDATE "Booking" SET "paymentStatus" = 'REFUNDED', "updatedAt" = NOW() WHERE id = $1`,
      bookingId
    );
    await restoreVoucherBalance(booking.voucherCode, booking.discountAmount);
    await restoreCouponRedemption(booking.couponCode);
    return { refunded: true, stripeRefundId: 'free_booking' };
  }

  const secretKey = await settingsService.getStripeSecretKey();
  if (!secretKey) {
    return { refunded: false, reason: 'Payment gateway not configured' };
  }

  const stripe = createStripeClient(secretKey);

  // Idempotency key prevents duplicate refunds; charge_already_refunded recovery
  // handles the crash-after-Stripe-before-DB case (B17).
  let stripeRefundId: string;
  try {
    const refund = await stripe.refunds.create(
      {
        payment_intent: booking.stripePaymentId,
        reason: 'requested_by_customer',
      },
      { idempotencyKey: `refund-booking-${bookingId}` }
    );
    stripeRefundId = refund.id;
  } catch (err: any) {
    if (err?.code === 'charge_already_refunded') {
      // Stripe already has the refund — sync DB state
      stripeRefundId = 'stripe_already_refunded';
    } else {
      return { refunded: false, reason: 'Stripe refund failed' };
    }
  }

  await prisma.$executeRawUnsafe(
    `UPDATE "Booking" SET "paymentStatus" = 'REFUNDED', "updatedAt" = NOW() WHERE id = $1`,
    bookingId
  );
  await restoreVoucherBalance(booking.voucherCode, booking.discountAmount);
  await restoreCouponRedemption(booking.couponCode);

  return { refunded: true, stripeRefundId };
}

async function restoreVoucherBalance(
  voucherCode: string | null,
  discountAmount: string | null
): Promise<void> {
  if (!voucherCode || !discountAmount) return;
  const discount = parseFloat(discountAmount);
  if (!Number.isFinite(discount) || discount <= 0) return;

  // Atomic addition avoids read-then-write race under concurrent refunds
  await prisma.$executeRawUnsafe(
    `UPDATE "GiftVoucher"
     SET balance = balance + $2::decimal, "isRedeemed" = false
     WHERE code = $1`,
    voucherCode,
    discount.toFixed(2)
  );
}

async function restoreCouponRedemption(couponCode: string | null): Promise<void> {
  if (!couponCode) return;
  await prisma.$executeRawUnsafe(
    `UPDATE "Coupon"
     SET "redemptionCount" = GREATEST(0, "redemptionCount" - 1), "updatedAt" = NOW()
     WHERE code = $1`,
    couponCode
  );
}

export default { issueRefundForBooking, restoreVoucherBalance, restoreCouponRedemption };
