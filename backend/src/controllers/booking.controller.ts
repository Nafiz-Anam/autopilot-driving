import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import bookingService from '../services/booking.service';
import rescheduleService from '../services/reschedule.service';
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const getAvailability = catchAsync(async (req: Request, res: Response) => {
  const instructorId = String(req.query.instructorId ?? '').trim();
  const startDate = String(req.query.startDate ?? '').trim();
  const endDate = String(req.query.endDate ?? '').trim();

  if (!instructorId || !startDate || !endDate) {
    return res.status(httpStatus.BAD_REQUEST).send({
      success: false,
      error: 'instructorId, startDate, endDate required',
    });
  }

  if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
    return res.status(httpStatus.BAD_REQUEST).send({
      success: false,
      error: 'startDate and endDate must be YYYY-MM-DD',
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
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Invalid action', details: parsed.error.flatten() });
  }

  const result = await bookingService.cancelForStudent(bookingId, studentId, parsed.data.reason);

  if ('error' in result) {
    switch (result.error) {
      case 'NOT_FOUND':
        return res.status(httpStatus.NOT_FOUND).send({ error: 'Not found' });
      case 'FORBIDDEN':
        return res.status(httpStatus.FORBIDDEN).send({ error: 'Forbidden' });
      case 'BAD_STATE':
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'Booking cannot be cancelled' });
      default:
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'Invalid request' });
    }
  }

  res.status(httpStatus.OK).send({ data: result.data });
});

const postReschedule = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.appUserId! as string;
  const bookingId = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
  const proposedDateTime: string | undefined = req.body?.proposedDateTime;
  const reason: string | undefined = req.body?.reason;
  const notes: string | undefined = req.body?.notes;

  if (!proposedDateTime || !reason) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'proposedDateTime and reason are required' });
  }

  const result = await bookingService.createRescheduleRequest(bookingId, studentId, {
    proposedDateTime,
    reason,
    notes,
  });

  if ('error' in result) {
    const code =
      result.error === 'NOT_FOUND' ? httpStatus.NOT_FOUND :
      result.error === 'FORBIDDEN' ? httpStatus.FORBIDDEN :
      httpStatus.BAD_REQUEST;
    return res.status(code).send({ error: result.error });
  }

  res.status(httpStatus.OK).send({ success: true, data: result.data });
});

const patchReschedule = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.appUserId! as string;
  const bookingId = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
  const requestId: string | undefined = req.body?.requestId;
  const accept: boolean | undefined = req.body?.accept;

  if (!requestId || accept === undefined) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'requestId and accept are required' });
  }

  // Verify the student owns the booking for this reschedule request
  const ownership = await bookingService.respondToRescheduleRequest(requestId, studentId);
  if ('error' in ownership) {
    return res.status(httpStatus.FORBIDDEN).send({ error: 'Forbidden' });
  }

  const result = await rescheduleService.respondToRequest({
    requestId,
    respondedByUserId: studentId,
    respondedByRole: 'STUDENT',
    accept: Boolean(accept),
  });

  if ('error' in result) {
    const code =
      result.error === 'NOT_FOUND' ? httpStatus.NOT_FOUND :
      result.error === 'FORBIDDEN' ? httpStatus.FORBIDDEN :
      httpStatus.BAD_REQUEST;
    return res.status(code).send({ error: result.error });
  }

  res.status(httpStatus.OK).send({ success: true, data: result.data });
});

export default {
  listMine,
  createMine,
  getAvailability,
  cancelMine,
  postReschedule,
  patchReschedule,
};
