import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import pricingService from '../services/pricing.service';

const getCategories = catchAsync(async (req: Request, res: Response) => {
  const data = await pricingService.listActivePricingCategories();
  res.status(httpStatus.OK).send({ success: true, data });
});

const getPackages = catchAsync(async (req: Request, res: Response) => {
  const lessonType = String(req.query.lessonType || '');
  if (!lessonType) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .send({ success: false, error: 'lessonType query required (e.g. MANUAL)' });
  }

  if (!pricingService.LESSON_TYPES.includes(lessonType as any)) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .send({ success: false, error: 'lessonType query required (e.g. MANUAL)' });
  }

  const data = await pricingService.listPackagesForLessonType(lessonType);
  res.status(httpStatus.OK).send({ success: true, data: data ?? [] });
});

export default {
  getCategories,
  getPackages,
};
