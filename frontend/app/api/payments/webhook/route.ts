import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeSecretKey, getStripeWebhookSecret } from "@/lib/settings";
import { finalizeBookingFromSucceededPayment } from "@/lib/booking-payment";
import { finalizeGiftVoucherPurchaseFromPayment } from "@/lib/gift-voucher-payment";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = await request.arrayBuffer();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const secretKey = await getStripeSecretKey();
    const webhookSecret = await getStripeWebhookSecret();

    if (!secretKey || !webhookSecret) {
      console.error("[webhook] Stripe not configured");
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
    }

    const stripe = new Stripe(secretKey);

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        Buffer.from(rawBody),
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error("[webhook] signature verification failed:", err);
      return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const md = paymentIntent.metadata;
        if (md.type === "gift_voucher") {
          await finalizeGiftVoucherPurchaseFromPayment(paymentIntent);
        } else if (md.bookingId) {
          await finalizeBookingFromSucceededPayment(paymentIntent);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { bookingId } = paymentIntent.metadata;

        if (bookingId) {
          await prisma.booking.update({
            where: { id: bookingId },
            data: { paymentStatus: "UNPAID" },
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
