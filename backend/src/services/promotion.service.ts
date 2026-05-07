import prisma from '../client';

type CouponRow = {
  code: string;
  name: string | null;
  type: 'PERCENT' | 'FIXED';
  value: string;
  maxDiscountAmount: string | null;
  minOrderAmount: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  isActive: boolean;
};

type VoucherRow = {
  code: string;
  balance: string;
  isRedeemed: boolean;
  expiresAt: Date;
};

const normalizeCode = (code: string) => code.trim().toUpperCase();

const validatePromotion = async (code: string, amount: number) => {
  const norm = normalizeCode(code);

  const voucherRows = await prisma.$queryRawUnsafe<VoucherRow[]>(
    `SELECT code, balance::text AS balance, "isRedeemed", "expiresAt"
     FROM "GiftVoucher"
     WHERE code = $1
     LIMIT 1`,
    norm
  );

  const voucher = voucherRows[0];
  if (voucher) {
    if (voucher.isRedeemed) {
      return { valid: false as const, reason: 'Voucher has already been fully redeemed' };
    }
    if (new Date(voucher.expiresAt) < new Date()) {
      return { valid: false as const, reason: 'Voucher has expired' };
    }
    const balance = Number(voucher.balance);
    const discount = Math.min(balance, amount);
    return {
      valid: true as const,
      kind: 'gift_voucher' as const,
      discount,
      remainingBalance: Math.max(0, balance - discount),
    };
  }

  const couponRows = await prisma.$queryRawUnsafe<CouponRow[]>(
    `SELECT code, name, type, value::text AS value, "maxDiscountAmount"::text AS "maxDiscountAmount",
            "minOrderAmount"::text AS "minOrderAmount", "startsAt", "endsAt",
            "maxRedemptions", "redemptionCount", "isActive"
     FROM "Coupon"
     WHERE code = $1
     LIMIT 1`,
    norm
  );

  const coupon = couponRows[0];
  if (!coupon) {
    return { valid: false as const, reason: 'Code not found' };
  }

  if (!coupon.isActive) return { valid: false as const, reason: 'Coupon is inactive' };
  if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) {
    return { valid: false as const, reason: 'Coupon is not active yet' };
  }
  if (coupon.endsAt && new Date(coupon.endsAt) < new Date()) {
    return { valid: false as const, reason: 'Coupon has expired' };
  }
  if (coupon.maxRedemptions != null && coupon.redemptionCount >= coupon.maxRedemptions) {
    return { valid: false as const, reason: 'Coupon redemption limit reached' };
  }
  if (coupon.minOrderAmount != null && amount < Number(coupon.minOrderAmount)) {
    return {
      valid: false as const,
      reason: `Minimum order amount is £${Number(coupon.minOrderAmount)}`,
    };
  }

  const rawValue = Number(coupon.value);
  const discount =
    coupon.type === 'PERCENT'
      ? Math.min(
          amount,
          coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : Number.POSITIVE_INFINITY,
          (amount * rawValue) / 100
        )
      : Math.min(amount, rawValue);

  return {
    valid: true as const,
    kind: 'coupon' as const,
    discount: Math.round(discount * 100) / 100,
    couponName: coupon.name,
  };
};

export default { validatePromotion };
