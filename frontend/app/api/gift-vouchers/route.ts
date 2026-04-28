import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { giftVoucherSchema } from "@/lib/validations/giftVoucher.schema";
import { generateVoucherCode } from "@/lib/utils";
import { env } from "@/env";
import { addYears } from "date-fns";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

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

    // Generate unique voucher code
    let code = generateVoucherCode();
    let attempt = 0;
    while (attempt < 5) {
      const existing = await prisma.giftVoucher.findUnique({ where: { code } });
      if (!existing) break;
      code = generateVoucherCode();
      attempt++;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountPence,
      currency: "gbp",
      metadata: {
        type: "gift_voucher",
        voucherCode: code,
        senderName,
        recipientName,
        recipientEmail,
      },
    });

    // Create voucher record (will be activated on webhook)
    await prisma.giftVoucher.create({
      data: {
        code,
        amount,
        balance: amount,
        isRedeemed: false,
        senderName,
        recipientName,
        recipientEmail,
        message,
        stripePaymentId: paymentIntent.id,
        expiresAt: addYears(new Date(), 1),
      },
    });

    return NextResponse.json({
      success: true,
      data: { clientSecret: paymentIntent.client_secret, code },
    });
  } catch (err) {
    console.error("[gift-vouchers] error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
