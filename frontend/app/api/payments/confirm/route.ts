import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripeSecretKey } from "@/lib/settings";
import { finalizeBookingFromSucceededPayment } from "@/lib/booking-payment";

/**
 * After Stripe.js confirmPayment succeeds (or user returns from 3DS), sync server-side state.
 * Webhooks remain the source of truth in production; this is idempotent and helps local/dev latency.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
    }

    const body = (await request.json()) as { paymentIntentId?: string };
    const paymentIntentId = body.paymentIntentId?.trim();
    if (!paymentIntentId) {
      return NextResponse.json({ success: false, error: "paymentIntentId required" }, { status: 400 });
    }

    const secretKey = await getStripeSecretKey();
    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: "Payment gateway not configured." },
        { status: 503 }
      );
    }

    const stripe = new Stripe(secretKey);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.metadata.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const bookingId = paymentIntent.metadata.bookingId;
    if (bookingId) {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking || booking.studentId !== session.user.id) {
        return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
      }
    }

    if (paymentIntent.status === "succeeded") {
      await finalizeBookingFromSucceededPayment(paymentIntent);
    }

    return NextResponse.json({
      success: true,
      data: { status: paymentIntent.status },
    });
  } catch (err) {
    console.error("[payments/confirm] error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
