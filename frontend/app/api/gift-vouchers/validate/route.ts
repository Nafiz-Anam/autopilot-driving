import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const validateSchema = z.object({
  code: z.string().min(1, "Code required"),
  amount: z.number().positive().optional(),
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

    const voucher = await prisma.giftVoucher.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!voucher) {
      return NextResponse.json({
        success: true,
        data: { valid: false, reason: "Voucher code not found" },
      });
    }

    if (voucher.isRedeemed) {
      return NextResponse.json({
        success: true,
        data: { valid: false, reason: "Voucher has already been fully redeemed" },
      });
    }

    if (voucher.expiresAt < new Date()) {
      return NextResponse.json({
        success: true,
        data: { valid: false, reason: "Voucher has expired" },
      });
    }

    const remainingBalance = Number(voucher.balance);
    const discount = amount ? Math.min(remainingBalance, amount) : remainingBalance;

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        discount,
        remainingBalance,
        voucherAmount: Number(voucher.amount),
        recipientName: voucher.recipientName,
      },
    });
  } catch (err) {
    console.error("[gift-vouchers/validate] error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
