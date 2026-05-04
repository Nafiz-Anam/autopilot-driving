import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  buildGiftVoucherResult,
  normalizePromoCode,
  validateCouponForOrder,
} from "@/lib/promotions";

const validateSchema = z.object({
  code: z.string().min(1, "Code required"),
  amount: z.number().positive(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = validateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input" },
        { status: 400 }
      );
    }

    const { code, amount } = parsed.data;
    const norm = normalizePromoCode(code);

    const voucher = await prisma.giftVoucher.findUnique({
      where: { code: norm },
    });

    if (voucher) {
      if (voucher.isRedeemed) {
        return NextResponse.json({
          success: true,
          data: { valid: false as const, reason: "Voucher has already been fully redeemed" },
        });
      }
      if (voucher.expiresAt < new Date()) {
        return NextResponse.json({
          success: true,
          data: { valid: false as const, reason: "Voucher has expired" },
        });
      }
      return NextResponse.json({
        success: true,
        data: buildGiftVoucherResult(voucher, amount),
      });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: norm },
    });

    if (!coupon) {
      return NextResponse.json({
        success: true,
        data: { valid: false as const, reason: "Code not found" },
      });
    }

    const check = validateCouponForOrder(coupon, amount);
    if (!check.ok) {
      return NextResponse.json({
        success: true,
        data: { valid: false as const, reason: check.reason },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        kind: "coupon" as const,
        discount: check.discount,
        couponName: coupon.name,
      },
    });
  } catch (err) {
    console.error("[promotions/validate] error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
