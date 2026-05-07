import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import promotionService from '../services/promotion.service';

const validate = catchAsync(async (req: Request, res: Response) => {
  const { code, amount } = req.body as { code?: string; amount?: number };
  if (!code || !amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(httpStatus.BAD_REQUEST).send({ success: false, error: 'Invalid input' });
  }

  const data = await promotionService.validatePromotion(code, Number(amount));
  res.status(httpStatus.OK).send({ success: true, data });
});

export default { validate };
