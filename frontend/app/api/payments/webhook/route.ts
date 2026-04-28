import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { env } from "@/env";

export const dynamic = "force-dynamic";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function POST(request: Request) {
  try {
    const rawBody = await request.arrayBuffer();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        Buffer.from(rawBody),
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("[webhook] signature verification failed:", err);
      return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { bookingId, voucherCode, discountAmount } = paymentIntent.metadata;

        if (bookingId) {
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              paymentStatus: "PAID",
              status: "CONFIRMED",
              stripePaymentId: paymentIntent.id,
              ...(voucherCode ? { voucherCode } : {}),
              ...(discountAmount ? { discountAmount: parseFloat(discountAmount) } : {}),
            },
          });

          // Deduct voucher balance if used
          if (voucherCode && discountAmount && parseFloat(discountAmount) > 0) {
            const voucher = await prisma.giftVoucher.findUnique({ where: { code: voucherCode } });
            if (voucher) {
              const newBalance = Math.max(0, Number(voucher.balance) - parseFloat(discountAmount));
              await prisma.giftVoucher.update({
                where: { code: voucherCode },
                data: {
                  balance: newBalance,
                  isRedeemed: newBalance === 0,
                },
              });
            }
          }
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
        // Unhandled event type — ignore
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
