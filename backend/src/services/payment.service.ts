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
      paymentStatus: string;
      status: string;
      stripePaymentId: string | null;
    }>
  >(
    `SELECT id, "studentId", "totalAmount"::text, "paymentStatus"::text, status::text, "stripePaymentId"
     FROM "Booking" WHERE id = $1 LIMIT 1`,
    bookingId
  );

  const booking = brows[0];
  if (!booking || booking.studentId !== studentId) {
    return { error: 'NOT_FOUND' as const, message: 'Booking not found' };
  }
  if (booking.paymentStatus === 'PAID' || booking.paymentStatus === 'REFUNDED') {
    return { error: 'BAD_REQUEST' as const, message: 'This booking has already been paid' };
  }
  if (booking.status === 'CANCELLED') {
    return { error: 'BAD_REQUEST' as const, message: 'Cannot pay for a cancelled booking' };
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
      discountAmount = Math.min(Number(voucher.balance), bookingTotal);
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

  // Zero-amount path — bypass Stripe entirely (free booking or fully discounted)
  if (amountPence === 0) {
    // RETURNING id acts as a CAS: only one concurrent request wins; the loser sees 0 rows and exits
    const updated = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `UPDATE "Booking"
       SET "paymentStatus" = 'PAID', status = 'CONFIRMED',
           "voucherCode" = COALESCE($2, "voucherCode"),
           "couponCode" = COALESCE($3, "couponCode"),
           "discountAmount" = COALESCE($4::decimal, "discountAmount"),
           "updatedAt" = NOW()
       WHERE id = $1 AND "paymentStatus" <> 'PAID'
       RETURNING id`,
      bookingId,
      normVoucher ?? null,
      normCoupon ?? null,
      discountAmount > 0 ? discountAmount.toFixed(2) : null
    );

    if (updated.length > 0) {
      if (normVoucher && discountAmount > 0) {
        await prisma.$executeRawUnsafe(
          `UPDATE "GiftVoucher"
           SET balance = GREATEST(0, balance - $2::decimal),
               "isRedeemed" = CASE WHEN balance - $2::decimal <= 0 THEN true ELSE "isRedeemed" END
           WHERE code = $1`,
          normVoucher,
          discountAmount.toFixed(2)
        );
      } else if (normCoupon) {
        await prisma.$executeRawUnsafe(
          `UPDATE "Coupon" SET "redemptionCount" = "redemptionCount" + 1, "updatedAt" = NOW() WHERE code = $1`,
          normCoupon
        );
      }
    }

    return { success: true as const, data: { fullyDiscounted: true } };
  }

  // Non-zero amount — initialize Stripe only when a charge is actually needed
  const secretKey = await settingsService.getStripeSecretKey();
  if (!secretKey) {
    return { error: 'SERVICE_UNAVAILABLE' as const, message: 'Payment gateway not configured. Contact support.' };
  }

  const stripe = createStripeClient(secretKey);

  // Idempotency: if a PI already exists for this booking and is still actionable,
  // reuse it — but only if the amount still matches. Otherwise the coupon/voucher
  // has changed since the PI was created and Stripe would charge the old price.
  if (booking.stripePaymentId) {
    try {
      const existing = await stripe.paymentIntents.retrieve(booking.stripePaymentId);
      const canReuse = !['canceled', 'succeeded'].includes(existing.status);

      if (canReuse && existing.amount === amountPence) {
        return {
          success: true as const,
          data: {
            clientSecret: existing.client_secret,
            paymentIntentId: existing.id,
          },
        };
      }

      // Amount changed (coupon added/removed/swapped). Try to update the PI in-place
      // if it's still in a mutable state; otherwise cancel it and fall through to
      // create a fresh one below.
      const updatableStates = ['requires_payment_method', 'requires_confirmation', 'requires_action'];
      if (canReuse && updatableStates.includes(existing.status)) {
        const updated = await stripe.paymentIntents.update(existing.id, {
          amount: amountPence,
          metadata: {
            bookingId,
            userId: studentId,
            voucherCode: normVoucher ?? '',
            couponCode: normCoupon ?? '',
            discountAmount: discountAmount.toString(),
          },
        });
        await prisma.$executeRawUnsafe(
          `UPDATE "Booking"
             SET "voucherCode" = $2, "couponCode" = $3,
                 "discountAmount" = $4::decimal, "updatedAt" = NOW()
           WHERE id = $1`,
          bookingId,
          normVoucher ?? null,
          normCoupon ?? null,
          discountAmount > 0 ? discountAmount.toFixed(2) : '0'
        );
        return {
          success: true as const,
          data: {
            clientSecret: updated.client_secret,
            paymentIntentId: updated.id,
          },
        };
      }

      // Non-mutable or terminal — cancel and fall through to create a new PI
      if (canReuse) {
        try { await stripe.paymentIntents.cancel(existing.id); } catch { /* best-effort */ }
      }
    } catch {
      // Stale PI — fall through and create a new one
    }
  }

  // Non-zero path — atomically reserve voucher/coupon BEFORE calling Stripe.
  // This prevents concurrent requests from both applying the same discount.
  // The reservation is stored in the PI metadata and restored on payment failure or cancellation.
  if (normVoucher && discountAmount > 0) {
    const reserved = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `UPDATE "GiftVoucher"
       SET balance = balance - $2::decimal,
           "isRedeemed" = CASE WHEN balance = $2::decimal THEN true ELSE "isRedeemed" END
       WHERE code = $1 AND "isRedeemed" = false AND balance >= $2::decimal
       RETURNING id`,
      normVoucher,
      discountAmount.toFixed(2)
    );
    if (!reserved.length) {
      return { error: 'BAD_REQUEST' as const, message: 'Gift voucher has insufficient balance' };
    }
  } else if (normCoupon && discountAmount > 0) {
    const claimed = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `UPDATE "Coupon"
       SET "redemptionCount" = "redemptionCount" + 1, "updatedAt" = NOW()
       WHERE code = $1 AND ("maxRedemptions" IS NULL OR "redemptionCount" < "maxRedemptions")
       RETURNING id`,
      normCoupon
    );
    if (!claimed.length) {
      return { error: 'BAD_REQUEST' as const, message: 'This coupon has reached its usage limit' };
    }
  }

  let paymentIntent: Awaited<ReturnType<typeof stripe.paymentIntents.create>>;
  try {
    paymentIntent = await stripe.paymentIntents.create({
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
  } catch {
    // Stripe call failed — roll back the reservation so the user can retry
    if (normVoucher && discountAmount > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE "GiftVoucher" SET balance = balance + $2::decimal, "isRedeemed" = false WHERE code = $1`,
        normVoucher,
        discountAmount.toFixed(2)
      );
    } else if (normCoupon && discountAmount > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Coupon"
         SET "redemptionCount" = GREATEST(0, "redemptionCount" - 1), "updatedAt" = NOW()
         WHERE code = $1`,
        normCoupon
      );
    }
    return { error: 'SERVICE_UNAVAILABLE' as const, message: 'Payment gateway error. Please try again.' };
  }

  await prisma.$executeRawUnsafe(
    `UPDATE "Booking"
     SET "stripePaymentId" = $2,
         "voucherCode" = COALESCE($3, "voucherCode"),
         "couponCode" = COALESCE($4, "couponCode"),
         "discountAmount" = COALESCE($5::decimal, "discountAmount"),
         "updatedAt" = NOW()
     WHERE id = $1`,
    bookingId,
    paymentIntent.id,
    normVoucher ?? null,
    normCoupon ?? null,
    discountAmount > 0 ? discountAmount.toFixed(2) : null
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
