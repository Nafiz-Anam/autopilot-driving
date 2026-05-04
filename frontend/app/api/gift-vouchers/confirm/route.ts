import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeSecretKey } from "@/lib/settings";
import { finalizeGiftVoucherPurchaseFromPayment } from "@/lib/gift-voucher-payment";

/**
 * Syncs DB after client-side payment for gift vouchers (mirrors booking /api/payments/confirm).
 */
export async function POST(request: Request) {
  try {
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

    if (paymentIntent.metadata.type !== "gift_voucher") {
      return NextResponse.json({ success: false, error: "Invalid payment type" }, { status: 400 });
    }

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({
        success: true,
        data: { status: paymentIntent.status, code: null as string | null },
      });
    }

    const result = await finalizeGiftVoucherPurchaseFromPayment(paymentIntent);

    return NextResponse.json({
      success: true,
      data: {
        status: paymentIntent.status,
        code: result?.code ?? paymentIntent.metadata.voucherCode ?? null,
      },
    });
  } catch (err) {
    console.error("[gift-vouchers/confirm] error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
