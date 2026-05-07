import { z } from 'zod';

export const createBookingBodySchema = z
  .object({
    lessonType: z.enum(['MANUAL', 'AUTOMATIC', 'INTENSIVE', 'REFRESHER', 'PASS_PLUS', 'THEORY']),
    transmission: z.enum(['manual', 'automatic']),
    instructorId: z.string().min(1),
    packageId: z.string().min(1),
    scheduledAt: z.string().min(4),
    durationMins: z.number().int().min(60).optional().default(60),
    totalAmount: z.number().nonnegative().optional(),
    voucherCode: z.string().optional(),
    couponCode: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((d) => !(d.voucherCode && d.couponCode), {
    message: 'Use either a gift voucher or a coupon, not both',
    path: ['couponCode'],
  });

export const cancelBookingBodySchema = z.object({
  action: z.literal('cancel'),
});
