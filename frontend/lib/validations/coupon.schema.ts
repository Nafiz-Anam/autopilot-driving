import { z } from "zod";

export const adminCouponCreateSchema = z.object({
  code: z.string().min(3).max(32),
  name: z.string().max(120).optional(),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().positive(),
  maxDiscountAmount: z.number().positive().optional().nullable(),
  minOrderAmount: z.number().positive().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  maxRedemptions: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});
