import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import paymentService from '../services/payment.service';

const createIntent = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.appUserId!;
  const { bookingId, voucherCode, couponCode } = req.body as {
    bookingId?: string;
    voucherCode?: string;
    couponCode?: string;
  };

  if (!bookingId) {
    return res.status(httpStatus.BAD_REQUEST).send({ success: false, error: 'bookingId required' });
  }

  const result = await paymentService.createPaymentIntent({
    studentId,
    bookingId,
    voucherCode,
    couponCode,
  });

  if ('error' in result) {
    const map: Record<string, number> = {
      NOT_FOUND: httpStatus.NOT_FOUND,
      BAD_REQUEST: httpStatus.BAD_REQUEST,
      SERVICE_UNAVAILABLE: httpStatus.SERVICE_UNAVAILABLE,
    };
    return res.status(map[result.error] ?? 400).send({ success: false, error: result.message });
  }

  return res.status(httpStatus.OK).send({ success: true, data: result.data });
});

const confirm = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.appUserId!;
  const paymentIntentId = (req.body as { paymentIntentId?: string }).paymentIntentId?.trim();
  if (!paymentIntentId) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .send({ success: false, error: 'paymentIntentId required' });
  }

  const result = await paymentService.confirmPaymentIntent({ studentId, paymentIntentId });

  if ('error' in result) {
    const map: Record<string, number> = {
      NOT_FOUND: httpStatus.NOT_FOUND,
      FORBIDDEN: httpStatus.FORBIDDEN,
      SERVICE_UNAVAILABLE: httpStatus.SERVICE_UNAVAILABLE,
    };
    return res.status(map[result.error] ?? 400).send({ success: false, error: result.message });
  }

  return res.status(httpStatus.OK).send({ success: true, data: result.data });
});

export default { createIntent, confirm };
