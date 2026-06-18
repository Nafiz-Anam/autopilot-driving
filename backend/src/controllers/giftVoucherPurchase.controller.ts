import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { z } from 'zod';
import catchAsync from '../utils/catchAsync';
import giftVoucherPurchaseService from '../services/giftVoucherPurchase.service';

const bodySchema = z.object({
  amount: z.number().min(10),
  senderName: z.string().min(1),
  senderEmail: z.string().email(),
  recipientName: z.string().min(1),
  recipientEmail: z.string().email(),
  message: z.string().optional(),
});

const createIntent = catchAsync(async (req: Request, res: Response) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(httpStatus.BAD_REQUEST).send({
      success: false,
      error: 'Invalid input',
      details: parsed.error.flatten(),
    });
  }

  const result = await giftVoucherPurchaseService.createPaymentIntent(parsed.data);

  if ('error' in result) {
    const status =
      result.error === 'SERVICE_UNAVAILABLE' ? httpStatus.SERVICE_UNAVAILABLE : httpStatus.INTERNAL_SERVER_ERROR;
    return res.status(status).send({ success: false, error: result.message });
  }

  return res.status(httpStatus.OK).send({ success: true, data: result.data });
});

const confirm = catchAsync(async (req: Request, res: Response) => {
  const paymentIntentId = (req.body as { paymentIntentId?: string }).paymentIntentId?.trim();
  if (!paymentIntentId) {
    return res.status(httpStatus.BAD_REQUEST).send({ success: false, error: 'paymentIntentId required' });
  }

  const result = await giftVoucherPurchaseService.confirmFromPaymentIntent(paymentIntentId);

  if (result && 'error' in result) {
    const st =
      result.error === 'SERVICE_UNAVAILABLE' ? httpStatus.SERVICE_UNAVAILABLE : httpStatus.BAD_REQUEST;
    return res.status(st).send({ success: false, error: result.message });
  }

  return res.status(httpStatus.OK).send({ success: true, data: result.data });
});

export default { createIntent, confirm };
