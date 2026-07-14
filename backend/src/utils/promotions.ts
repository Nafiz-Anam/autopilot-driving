/** Port of frontend/lib/promotions.ts — coupon math only (no Prisma types). */

export type CouponLike = {
  type: 'PERCENT' | 'FIXED';
  value: string | number;
  maxDiscountAmount: string | number | null;
  minOrderAmount: string | number | null;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  maxRedemptions: number | null;
  redemptionCount: number;
};

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

export function computeCouponDiscount(coupon: CouponLike, orderTotal: number): number {
  const total = orderTotal;
  if (coupon.minOrderAmount != null && total < Number(coupon.minOrderAmount)) {
    return 0;
  }

  if (coupon.type === 'PERCENT') {
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
  coupon: CouponLike,
  orderTotal: number
): { ok: true; discount: number } | { ok: false; reason: string } {
  if (!coupon.isActive) {
    return { ok: false, reason: 'This coupon is not active' };
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, reason: 'This coupon is not valid yet' };
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return { ok: false, reason: 'This coupon has expired' };
  }

  if (coupon.maxRedemptions != null && coupon.redemptionCount >= coupon.maxRedemptions) {
    return { ok: false, reason: 'This coupon has reached its usage limit' };
  }

  if (coupon.minOrderAmount != null && orderTotal < Number(coupon.minOrderAmount)) {
    return {
      ok: false,
      reason: `Minimum order £${Number(coupon.minOrderAmount)} for this coupon`,
    };
  }

  const discount = computeCouponDiscount(coupon, orderTotal);
  if (discount <= 0) {
    return { ok: false, reason: 'This coupon does not apply to this order' };
  }

  return { ok: true, discount };
}
