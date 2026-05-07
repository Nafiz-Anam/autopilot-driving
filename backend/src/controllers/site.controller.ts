import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import settingsService from '../services/settings.service';

const stripePublishableKey = catchAsync(async (_req: Request, res: Response) => {
  const key = await settingsService.getStripePublishableKey();
  res.status(httpStatus.OK).send({ publishableKey: key || null });
});

export default {
  stripePublishableKey,
};
