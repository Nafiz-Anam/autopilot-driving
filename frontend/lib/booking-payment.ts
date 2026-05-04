import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";

/**
 * Idempotent: marks booking paid / confirmed from a succeeded PaymentIntent.
 * Used by Stripe webhooks and by POST /api/payments/confirm after client-side confirmation.
 */
export async function finalizeBookingFromSucceededPayment(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const { bookingId, voucherCode, couponCode, discountAmount } = paymentIntent.metadata;

  if (!bookingId) return;

  const d = discountAmount ? parseFloat(discountAmount) : 0;
  const vCode = voucherCode && voucherCode.length > 0 ? voucherCode : undefined;
  const cCode = couponCode && couponCode.length > 0 ? couponCode : undefined;

  const updated = await prisma.booking.updateMany({
    where: {
      id: bookingId,
      paymentStatus: { not: "PAID" },
    },
    data: {
      paymentStatus: "PAID",
      status: "CONFIRMED",
      stripePaymentId: paymentIntent.id,
      ...(vCode ? { voucherCode: vCode } : {}),
      ...(cCode ? { couponCode: cCode } : {}),
      ...(d > 0 ? { discountAmount: d } : {}),
    },
  });

  if (updated.count === 0) return;

  if (vCode && d > 0) {
    const voucher = await prisma.giftVoucher.findUnique({ where: { code: vCode } });
    if (voucher) {
      const newBalance = Math.max(0, Number(voucher.balance) - d);
      await prisma.giftVoucher.update({
        where: { code: vCode },
        data: {
          balance: newBalance,
          isRedeemed: newBalance === 0,
        },
      });
    }
  } else if (cCode) {
    await prisma.coupon.updateMany({
      where: { code: cCode },
      data: { redemptionCount: { increment: 1 } },
    });
  }
}
