import prisma from '../client';
import settingsService from './settings.service';
import { createStripeClient } from '../utils/stripeClient';
import { normalizePromoCode, validateCouponForOrder, type CouponLike } from '../utils/promotions';

/** POST /v1/payments — create PaymentIntent for own booking */
async function createPaymentIntent(params: {
  studentId: string;
  bookingId: string;
  voucherCode?: string;
  couponCode?: string;
}) {
  const { studentId, bookingId } = params;

  if (params.voucherCode && params.couponCode) {
    return { error: 'BAD_REQUEST' as const, message: 'Use either a gift voucher or a coupon, not both' };
  }

  const brows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      studentId: string;
      totalAmount: string;
    }>
  >(`SELECT id, "studentId", "totalAmount"::text FROM "Booking" WHERE id = $1 LIMIT 1`, bookingId);

  const booking = brows[0];
  if (!booking || booking.studentId !== studentId) {
    return { error: 'NOT_FOUND' as const, message: 'Booking not found' };
  }

  const bookingTotal = Number(booking.totalAmount);
  let amountPence = Math.round(bookingTotal * 100);
  let discountAmount = 0;

  const normVoucher = params.voucherCode ? normalizePromoCode(params.voucherCode) : undefined;
  const normCoupon = params.couponCode ? normalizePromoCode(params.couponCode) : undefined;

  if (normVoucher) {
    const vrows = await prisma.$queryRawUnsafe<
      Array<{ balance: string; isRedeemed: boolean }>
    >(`SELECT balance::text, "isRedeemed" FROM "GiftVoucher" WHERE code = $1 LIMIT 1`, normVoucher);

    const voucher = vrows[0];
    if (voucher && !voucher.isRedeemed && Number(voucher.balance) > 0) {
      const voucherBalance = Number(voucher.balance);
      discountAmount = Math.min(voucherBalance, bookingTotal);
      amountPence = Math.max(0, Math.round((bookingTotal - discountAmount) * 100));
    }
  } else if (normCoupon) {
    const crows = await prisma.$queryRawUnsafe<
      Array<{
        code: string;
        type: string;
        value: string;
        maxDiscountAmount: string | null;
        minOrderAmount: string | null;
        isActive: boolean;
        startsAt: Date | null;
        endsAt: Date | null;
        maxRedemptions: number | null;
        redemptionCount: number;
      }>
    >(`SELECT * FROM "Coupon" WHERE code = $1 LIMIT 1`, normCoupon);

    const coupon = crows[0];
    if (!coupon) {
      return { error: 'BAD_REQUEST' as const, message: 'Invalid or unknown coupon' };
    }
    const check = validateCouponForOrder(coupon as CouponLike, bookingTotal);
    if (check.ok === false) {
      return { error: 'BAD_REQUEST' as const, message: check.reason };
    }
    discountAmount = check.discount;
    amountPence = Math.max(0, Math.round((bookingTotal - discountAmount) * 100));
  }

  if (amountPence === 0) {
    await prisma.$executeRawUnsafe(
      `UPDATE "Booking"
       SET "paymentStatus" = 'PAID', status = 'CONFIRMED',
           "voucherCode" = COALESCE($2, "voucherCode"),
           "couponCode" = COALESCE($3, "couponCode"),
           "discountAmount" = COALESCE($4::decimal, "discountAmount"),
           "updatedAt" = NOW()
       WHERE id = $1`,
      bookingId,
      normVoucher ?? null,
      normCoupon ?? null,
      discountAmount > 0 ? discountAmount.toFixed(2) : null
    );

    if (normVoucher && discountAmount > 0) {
      const vrows = await prisma.$queryRawUnsafe<Array<{ balance: string }>>(
        `SELECT balance::text FROM "GiftVoucher" WHERE code = $1`,
        normVoucher
      );
      const v = vrows[0];
      if (v) {
        const newBalance = Math.max(0, Number(v.balance) - discountAmount);
        await prisma.$executeRawUnsafe(
          `UPDATE "GiftVoucher" SET balance = $2::decimal, "isRedeemed" = $3 WHERE code = $1`,
          normVoucher,
          newBalance.toFixed(2),
          newBalance === 0
        );
      }
    } else if (normCoupon) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Coupon" SET "redemptionCount" = "redemptionCount" + 1, "updatedAt" = NOW() WHERE code = $1`,
        normCoupon
      );
    }

    return { success: true as const, data: { fullyDiscounted: true } };
  }

  const secretKey = await settingsService.getStripeSecretKey();
  if (!secretKey) {
    return { error: 'SERVICE_UNAVAILABLE' as const, message: 'Payment gateway not configured. Contact support.' };
  }

  const stripe = createStripeClient(secretKey);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountPence,
    currency: 'gbp',
    automatic_payment_methods: { enabled: true },
    metadata: {
      bookingId,
      userId: studentId,
      voucherCode: normVoucher ?? '',
      couponCode: normCoupon ?? '',
      discountAmount: discountAmount.toString(),
    },
  });

  await prisma.$executeRawUnsafe(
    `UPDATE "Booking" SET "stripePaymentId" = $2, "updatedAt" = NOW() WHERE id = $1`,
    bookingId,
    paymentIntent.id
  );

  return {
    success: true as const,
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    },
  };
}

async function confirmPaymentIntent(params: { studentId: string; paymentIntentId: string }) {
  const secretKey = await settingsService.getStripeSecretKey();
  if (!secretKey) {
    return { error: 'SERVICE_UNAVAILABLE' as const, message: 'Payment gateway not configured.' };
  }

  const stripe = createStripeClient(secretKey);
  const paymentIntent = await stripe.paymentIntents.retrieve(params.paymentIntentId);

  if (paymentIntent.metadata.userId !== params.studentId) {
    return { error: 'FORBIDDEN' as const, message: 'Forbidden' };
  }

  const bookingId = paymentIntent.metadata.bookingId;
  if (bookingId) {
    const brows = await prisma.$queryRawUnsafe<Array<{ studentId: string }>>(
      `SELECT "studentId" FROM "Booking" WHERE id = $1 LIMIT 1`,
      bookingId
    );
    const booking = brows[0];
    if (!booking || booking.studentId !== params.studentId) {
      return { error: 'NOT_FOUND' as const, message: 'Booking not found' };
    }
  }

  if (paymentIntent.status === 'succeeded') {
    const paymentFinalizeService = await import('./paymentFinalize.service');
    await paymentFinalizeService.default.finalizeBookingFromSucceededPayment(paymentIntent);
  }

  return { success: true as const, data: { status: paymentIntent.status } };
}

export default {
  createPaymentIntent,
  confirmPaymentIntent,
};
