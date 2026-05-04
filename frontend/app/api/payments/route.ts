import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripeSecretKey } from "@/lib/settings";
import { normalizePromoCode, validateCouponForOrder } from "@/lib/promotions";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
    }

    const body = (await request.json()) as {
      bookingId: string;
      voucherCode?: string;
      couponCode?: string;
    };
    const { bookingId, voucherCode, couponCode } = body;

    if (!bookingId) {
      return NextResponse.json({ success: false, error: "bookingId required" }, { status: 400 });
    }

    if (voucherCode && couponCode) {
      return NextResponse.json(
        { success: false, error: "Use either a gift voucher or a coupon, not both" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, studentId: session.user.id },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    const bookingTotal = Number(booking.totalAmount);
    let amountPence = Math.round(bookingTotal * 100);
    let discountAmount = 0;
    const normVoucher = voucherCode ? normalizePromoCode(voucherCode) : undefined;
    const normCoupon = couponCode ? normalizePromoCode(couponCode) : undefined;

    if (normVoucher) {
      const voucher = await prisma.giftVoucher.findUnique({
        where: { code: normVoucher },
      });

      if (voucher && !voucher.isRedeemed && Number(voucher.balance) > 0) {
        const voucherBalance = Number(voucher.balance);
        discountAmount = Math.min(voucherBalance, bookingTotal);
        amountPence = Math.max(0, Math.round((bookingTotal - discountAmount) * 100));
      }
    } else if (normCoupon) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: normCoupon },
      });
      if (!coupon) {
        return NextResponse.json(
          { success: false, error: "Invalid or unknown coupon" },
          { status: 400 }
        );
      }
      const check = validateCouponForOrder(coupon, bookingTotal);
      if (!check.ok) {
        return NextResponse.json({ success: false, error: check.reason }, { status: 400 });
      }
      discountAmount = check.discount;
      amountPence = Math.max(0, Math.round((bookingTotal - discountAmount) * 100));
    }

    if (amountPence === 0) {
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            paymentStatus: "PAID",
            status: "CONFIRMED",
            voucherCode: normVoucher,
            couponCode: normCoupon,
            discountAmount,
          },
        });

        if (normVoucher && discountAmount > 0) {
          const v = await tx.giftVoucher.findUnique({ where: { code: normVoucher } });
          if (v) {
            const newBalance = Math.max(0, Number(v.balance) - discountAmount);
            await tx.giftVoucher.update({
              where: { code: normVoucher },
              data: {
                balance: newBalance,
                isRedeemed: newBalance === 0,
              },
            });
          }
        } else if (normCoupon) {
          await tx.coupon.update({
            where: { code: normCoupon },
            data: { redemptionCount: { increment: 1 } },
          });
        }
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
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingId,
        userId: session.user.id,
        voucherCode: normVoucher ?? "",
        couponCode: normCoupon ?? "",
        discountAmount: discountAmount.toString(),
      },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { stripePaymentId: paymentIntent.id },
    });

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (err) {
    console.error("[payments] error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
