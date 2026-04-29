import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripeSecretKey } from "@/lib/settings";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
    }

    const body = await request.json() as { bookingId: string; voucherCode?: string };
    const { bookingId, voucherCode } = body;

    if (!bookingId) {
      return NextResponse.json({ success: false, error: "bookingId required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, studentId: session.user.id },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    let amountPence = Math.round(Number(booking.totalAmount) * 100);
    let discountAmount = 0;

    if (voucherCode) {
      const voucher = await prisma.giftVoucher.findUnique({
        where: { code: voucherCode },
      });

      if (voucher && !voucher.isRedeemed && Number(voucher.balance) > 0) {
        const voucherBalance = Number(voucher.balance);
        const bookingTotal = Number(booking.totalAmount);
        discountAmount = Math.min(voucherBalance, bookingTotal);
        amountPence = Math.max(0, Math.round((bookingTotal - discountAmount) * 100));
      }
    }

    if (amountPence === 0) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
          voucherCode,
          discountAmount,
        },
      });
      return NextResponse.json({ success: true, data: { fullyDiscounted: true } });
    }

    const secretKey = await getStripeSecretKey();
    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: "Payment gateway not configured. Contact support." },
        { status: 503 }
      );
    }

    const stripe = new Stripe(secretKey);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountPence,
      currency: "gbp",
      metadata: {
        bookingId,
        userId: session.user.id,
        voucherCode: voucherCode ?? "",
        discountAmount: discountAmount.toString(),
      },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { stripePaymentId: paymentIntent.id },
    });

    return NextResponse.json({
      success: true,
      data: { clientSecret: paymentIntent.client_secret },
    });
  } catch (err) {
    console.error("[payments] error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
