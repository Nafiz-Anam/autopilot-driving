import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import bookingService from '../services/booking.service';
import { createBookingBodySchema, cancelBookingBodySchema } from '../validations/booking.validation';

const listMine = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.appUserId!;
  const data = await bookingService.listForStudent(studentId);
  res.status(httpStatus.OK).send({ success: true, data });
});

const createMine = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.appUserId!;
  const parsed = createBookingBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(httpStatus.BAD_REQUEST).send({
      success: false,
      error: 'Invalid input',
      details: parsed.error.flatten(),
    });
  }

  const {
    lessonType,
    transmission: bodyTransmission,
    instructorId,
    scheduledAt,
    durationMins,
    packageId,
    voucherCode,
    couponCode,
    notes,
  } = parsed.data;

  const transmission =
    lessonType === 'MANUAL'
      ? 'manual'
      : lessonType === 'AUTOMATIC'
        ? 'automatic'
        : bodyTransmission;

  const created = await bookingService.createForStudent({
    studentId,
    lessonType,
    transmission,
    instructorId,
    scheduledAt,
    durationMins: durationMins ?? 60,
    packageId,
    voucherCode,
    couponCode,
    notes,
  });

  if (!created) {
    return res.status(httpStatus.BAD_REQUEST).send({
      success: false,
      error: 'Invalid or inactive package for this lesson type',
    });
  }

  res.status(httpStatus.OK).send({
    success: true,
    data: {
      id: created.id,
      reference: created.reference,
      status: created.status,
      paymentStatus: created.paymentStatus,
    },
  });
});

const getAvailability = catchAsync(async (req: Request, res: Response) => {
  const instructorId = String(req.query.instructorId ?? '');
  const startDate = String(req.query.startDate ?? '');
  const endDate = String(req.query.endDate ?? '');

  if (!instructorId || !startDate || !endDate) {
    return res.status(httpStatus.BAD_REQUEST).send({
      success: false,
      error: 'instructorId, startDate, endDate required',
    });
  }

  const data = await bookingService.getAvailability(instructorId, startDate, endDate);
  res.status(httpStatus.OK).send({ success: true, data });
});

const cancelMine = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.appUserId!;
  const rawId = req.params.id;
  const bookingId = typeof rawId === 'string' ? rawId : rawId?.[0] ?? '';
  const parsed = cancelBookingBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Invalid action' });
  }

  const result = await bookingService.cancelForStudent(bookingId, studentId);

  if ('error' in result) {
    switch (result.error) {
      case 'NOT_FOUND':
        return res.status(httpStatus.NOT_FOUND).send({ error: 'Not found' });
      case 'FORBIDDEN':
        return res.status(httpStatus.FORBIDDEN).send({ error: 'Forbidden' });
      case 'BAD_STATE':
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'Booking cannot be cancelled' });
      case 'WITHIN_24H':
        return res
          .status(httpStatus.BAD_REQUEST)
          .send({ error: 'Cannot cancel within 24 hours of lesson' });
      default:
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'Invalid request' });
    }
  }

  res.status(httpStatus.OK).send({ data: result.data });
});

export default {
  listMine,
  createMine,
  getAvailability,
  cancelMine,
};
