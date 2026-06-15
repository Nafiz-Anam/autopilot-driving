import { Request, Response } from 'express';
import httpStatus from 'http-status';
import Stripe from 'stripe';
import prisma from '../client';
import settingsService from '../services/settings.service';
import paymentFinalizeService from '../services/paymentFinalize.service';
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
      case 'charge.refunded': {
        // Safety net: Stripe confirms the refund completed — mark booking REFUNDED if not already
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent && typeof charge.payment_intent === 'string') {
          await prisma.$executeRawUnsafe(
            `UPDATE "Booking"
             SET "paymentStatus" = 'REFUNDED', "updatedAt" = NOW()
             WHERE "stripePaymentId" = $1 AND "paymentStatus" <> 'REFUNDED'`,
            charge.payment_intent
          );
        }
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
