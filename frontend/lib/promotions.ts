import type { CouponTypeEnum } from "@/types";

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

export type PromoValidationResult =
  | {
      valid: true;
      kind: "gift_voucher";
      discount: number;
      remainingBalance: number;
      voucherAmount: number;
      recipientName: string;
    }
  | {
      valid: true;
      kind: "coupon";
      discount: number;
      couponName: string | null;
    }
  | { valid: false; reason: string };

/** Coupon fields used by promo helpers (aligned with backend schema). */
export type CouponForPromo = {
  type: CouponTypeEnum;
  value: unknown;
  maxDiscountAmount: unknown;
  minOrderAmount: unknown;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  maxRedemptions: number | null;
  redemptionCount: number;
};

export type GiftVoucherForPromo = {
  balance: unknown;
  amount: unknown;
  recipientName: string;
};

export function computeCouponDiscount(coupon: CouponForPromo, orderTotal: number): number {
  const total = orderTotal;
  if (coupon.minOrderAmount != null && total < Number(coupon.minOrderAmount)) {
    return 0;
  }

  if (coupon.type === "PERCENT") {
    const pct = Number(coupon.value);
    let off = Math.round(((total * pct) / 100) * 100) / 100;
    if (coupon.maxDiscountAmount != null) {
      off = Math.min(off, Number(coupon.maxDiscountAmount));
    }
    return Math.min(off, total);
  }

  const fixed = Number(coupon.value);
  return Math.min(fixed, total);
}

export function validateCouponForOrder(
  coupon: CouponForPromo,
  orderTotal: number
): { ok: true; discount: number } | { ok: false; reason: string } {
  if (!coupon.isActive) {
    return { ok: false, reason: "This coupon is not active" };
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, reason: "This coupon is not valid yet" };
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return { ok: false, reason: "This coupon has expired" };
  }

  if (coupon.maxRedemptions != null && coupon.redemptionCount >= coupon.maxRedemptions) {
    return { ok: false, reason: "This coupon has reached its usage limit" };
  }

  if (coupon.minOrderAmount != null && orderTotal < Number(coupon.minOrderAmount)) {
    return {
      ok: false,
      reason: `Minimum order £${Number(coupon.minOrderAmount)} for this coupon`,
    };
  }

  const discount = computeCouponDiscount(coupon, orderTotal);
  if (discount <= 0) {
    return { ok: false, reason: "This coupon does not apply to this order" };
  }

  return { ok: true, discount };
}

export function buildGiftVoucherResult(
  voucher: GiftVoucherForPromo,
  orderTotal: number
): Extract<PromoValidationResult, { kind: "gift_voucher" }> {
  const remainingBalance = Number(voucher.balance);
  const discount = Math.min(remainingBalance, orderTotal);
  return {
    valid: true,
    kind: "gift_voucher",
    discount,
    remainingBalance,
    voucherAmount: Number(voucher.amount),
    recipientName: voucher.recipientName,
  };
}
