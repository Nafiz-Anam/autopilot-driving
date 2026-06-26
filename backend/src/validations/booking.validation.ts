import { z } from 'zod';

export const createBookingBodySchema = z
  .object({
    lessonType: z.enum(['MANUAL', 'AUTOMATIC', 'INTENSIVE', 'REFRESHER', 'PASS_PLUS', 'THEORY']),
    transmission: z.enum(['manual', 'automatic']).optional(),
    instructorId: z.string().min(1).optional(),
    packageId: z.string().min(1),
    scheduledAt: z.string().min(4).optional(),
    durationMins: z.number().int().min(60).optional().default(60),
    totalAmount: z.number().nonnegative().optional(),
    voucherCode: z.string().optional(),
    couponCode: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.voucherCode && d.couponCode) {
      ctx.addIssue({ code: 'custom', message: 'Use either a gift voucher or a coupon, not both', path: ['couponCode'] });
    }
    if (d.lessonType !== 'THEORY') {
      if (!d.instructorId) {
        ctx.addIssue({ code: 'custom', message: 'instructorId is required', path: ['instructorId'] });
      }
      if (!d.scheduledAt) {
        ctx.addIssue({ code: 'custom', message: 'scheduledAt is required', path: ['scheduledAt'] });
      }
      if (!d.transmission) {
        ctx.addIssue({ code: 'custom', message: 'transmission is required', path: ['transmission'] });
      }
    }
  });

export const cancelBookingBodySchema = z.object({
  action: z.literal('cancel'),
  reason: z.string().min(1, 'Cancellation reason is required').max(500),
});
