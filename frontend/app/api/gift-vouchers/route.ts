import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { giftVoucherSchema } from "@/lib/validations/giftVoucher.schema";
import { generateVoucherCode } from "@/lib/utils";
import { getStripeSecretKey } from "@/lib/settings";

const META_MAX = 450;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = giftVoucherSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { amount, senderName, recipientName, recipientEmail, message } = parsed.data;
    const amountPence = Math.round(amount * 100);

    let code = generateVoucherCode();
    let attempt = 0;
    while (attempt < 12) {
      const existing = await prisma.giftVoucher.findUnique({ where: { code } });
      if (!existing) break;
      code = generateVoucherCode();
      attempt++;
    }
    if (attempt >= 12) {
      return NextResponse.json({ success: false, error: "Could not allocate voucher code" }, { status: 500 });
    }

    const secretKey = await getStripeSecretKey();
    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: "Payment gateway not configured. Contact support." },
        { status: 503 }
      );
    }

    const stripe = new Stripe(secretKey);
    const msg = (message ?? "").slice(0, META_MAX);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountPence,
      currency: "gbp",
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: "gift_voucher",
        voucherCode: code,
        amountGbp: amount.toFixed(2),
        senderName: senderName.slice(0, 80),
        recipientName: recipientName.slice(0, 80),
        recipientEmail: recipientEmail.slice(0, 120),
        message: msg,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        code,
      },
    });
  } catch (err) {
    console.error("[gift-vouchers] error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
