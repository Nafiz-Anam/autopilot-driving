import { Request, Response } from 'express';
import httpStatus from 'http-status';
import Stripe from 'stripe';
import prisma from '../client';
import settingsService from '../services/settings.service';
import paymentFinalizeService from '../services/paymentFinalize.service';
import refundService from '../services/refund.service';
import { createStripeClient } from '../utils/stripeClient';

/**
 * Stripe webhook — register with `express.raw` in `app.ts` (before `express.json()`).
 */
async function handleStripe(req: Request, res: Response): Promise<void> {
  try {
    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      res.status(httpStatus.BAD_REQUEST).json({ error: 'Missing signature' });
      return;
    }

    const secretKey = await settingsService.getStripeSecretKey();
    const webhookSecret = await settingsService.getStripeWebhookSecret();

    if (!secretKey || !webhookSecret) {
      res.status(httpStatus.SERVICE_UNAVAILABLE).json({ error: 'Payment gateway not configured' });
      return;
    }

    const stripe = createStripeClient(secretKey);

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body as Buffer, signature, webhookSecret);
    } catch {
      res.status(httpStatus.BAD_REQUEST).json({ error: 'Webhook signature invalid' });
      return;
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const md = paymentIntent.metadata;
        if (md.type === 'gift_voucher') {
          await paymentFinalizeService.finalizeGiftVoucherPurchaseFromPayment(paymentIntent);
        } else if (md.bookingId) {
          await paymentFinalizeService.finalizeBookingFromSucceededPayment(paymentIntent);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await paymentFinalizeService.markBookingUnpaidFromFailed(paymentIntent);
        break;
      }

      case 'payment_intent.canceled': {
        // Stripe auto-cancels PIs after 24h — restore the reserved voucher/coupon and
        // clear stripePaymentId so the student can create a new PI.
        const pi = event.data.object as Stripe.PaymentIntent;
        if (pi.metadata.bookingId) {
          await prisma.$executeRawUnsafe(
            `UPDATE "Booking"
             SET "stripePaymentId" = NULL, "updatedAt" = NOW()
             WHERE id = $1 AND "paymentStatus" = 'UNPAID'`,
            pi.metadata.bookingId
          );
          await paymentFinalizeService.restorePromoFromMetadata(pi.metadata);
        }
        break;
      }

      case 'charge.refunded': {
        // Safety net for refunds issued directly in the Stripe dashboard.
        // Must restore voucher balance and coupon count, and invalidate any
        // gift voucher that was purchased via this charge.
        const charge = event.data.object as Stripe.Charge;
        const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
        if (!piId) break;

        // Booking refund path
        const bookingRows = await prisma.$queryRawUnsafe<Array<{
          id: string;
          voucherCode: string | null;
          couponCode: string | null;
          discountAmount: string | null;
          paymentStatus: string;
        }>>(
          `SELECT id, "voucherCode", "couponCode", "discountAmount"::text, "paymentStatus"::text
           FROM "Booking" WHERE "stripePaymentId" = $1 LIMIT 1`,
          piId
        );
        const booking = bookingRows[0];
        if (booking) {
          // RETURNING id ensures restore runs exactly once even if app path and webhook race
          const updated = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
            `UPDATE "Booking"
             SET "paymentStatus" = 'REFUNDED', "updatedAt" = NOW()
             WHERE "stripePaymentId" = $1 AND "paymentStatus" <> 'REFUNDED'
             RETURNING id`,
            piId
          );
          if (updated.length > 0) {
            await refundService.restoreVoucherBalance(booking.voucherCode, booking.discountAmount);
            await refundService.restoreCouponRedemption(booking.couponCode);
          }
        }

        // Gift voucher purchase refund path — invalidate the voucher so it can't be used
        await prisma.$executeRawUnsafe(
          `UPDATE "GiftVoucher"
           SET balance = 0, "isRedeemed" = true, "updatedAt" = NOW()
           WHERE "stripePaymentId" = $1 AND balance > 0`,
          piId
        );

        break;
      }

      default:
        break;
    }

    res.status(httpStatus.OK).json({ received: true });
  } catch {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
}

export default { handleStripe };
