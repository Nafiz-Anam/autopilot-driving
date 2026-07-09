import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../client';
import pricingService from './pricing.service';
import { generateBookingReference } from '../utils/bookingReference';
import rescheduleService from './reschedule.service';
import refundService from './refund.service';
import googleCalendarService from './googleCalendar.service';
import emailService from './email.service';
import {
  DayWindow,
  parseHHMM,
  formatHHMM,
  overlaps,
  mergeWindows,
  getDayWindows,
  isWithinAvailability,
} from '../utils/instructorAvailability';

// Availability policy: per-instructor availabilityMode picks the baseline.
//   - CALENDAR_SYNC: full 24h/day baseline, blocked only by (a) Google Calendar
//     busy events synced via webhook, (b) existing PENDING/CONFIRMED Bookings.
//   - CUSTOM_SLOTS: baseline is the instructor's weekly Availability template,
//     blocked only by existing PENDING/CONFIRMED Bookings (calendar ignored).
const SLOT_STEP_MINS = 60;
const MAX_BOOKING_HORIZON_DAYS = 60;

// Fetch pending reschedule requests for a set of booking IDs
async function fetchPendingReschedules(bookingIds: string[]) {
  if (!bookingIds.length) return {};
  try {
    const placeholders = bookingIds.map((_, i) => `$${i + 1}`).join(', ');
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        bookingId: string;
        requestedByRole: string;
        requestedByUserId: string;
        requesterName: string | null;
        proposedDateTime: Date;
        reason: string | null;
      }>
    >(
      `SELECT r.id, r."bookingId", r."requestedByRole", r."requestedByUserId",
              u.name AS "requesterName", r."proposedDateTime", r.reason
       FROM "RescheduleRequest" r
       LEFT JOIN users u ON u.id = r."requestedByUserId"
       WHERE r."bookingId" IN (${placeholders}) AND r.status = 'PENDING'::"RescheduleStatus"
       ORDER BY r."createdAt" DESC`,
      ...bookingIds
    );
    const map: Record<string, (typeof rows)[0]> = {};
    for (const r of rows) {
      if (!map[r.bookingId]) map[r.bookingId] = r;
    }
    return map;
  } catch {
    return {};
  }
}

const listForStudent = async (studentId: string) => {
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      reference: string;
      lessonType: string;
      transmission: string;
      scheduledAt: Date;
      durationMins: number;
      status: string;
      paymentStatus: string;
      totalAmount: string;
      instructor_rating: number;
      instructor_areas: string[] | string | null;
      instructor_user_name: string | null;
      instructor_user_image: string | null;
    }>
  >(
    `SELECT b.id, b.reference, b."lessonType", b.transmission, b."scheduledAt", b."durationMins",
            b.status, b."paymentStatus", b."totalAmount"::text AS "totalAmount",
            i.rating AS instructor_rating, i.areas AS instructor_areas,
            u.name AS instructor_user_name, u."profilePicture" AS instructor_user_image
     FROM "Booking" b
     INNER JOIN "Instructor" i ON i.id = b."instructorId"
     INNER JOIN users u ON u.id = i."userId"
     WHERE b."studentId" = $1
     ORDER BY b."scheduledAt" DESC`,
    studentId
  );

  const bookings = rows.map((b) => ({
    id: b.id,
    reference: b.reference,
    lessonType: b.lessonType,
    transmission: b.transmission,
    scheduledAt: b.scheduledAt.toISOString(),
    durationMins: b.durationMins,
    status: b.status,
    paymentStatus: b.paymentStatus,
    totalAmount: Number(b.totalAmount),
    instructor: {
      user: { name: b.instructor_user_name, image: b.instructor_user_image },
      rating: b.instructor_rating,
      areas: Array.isArray(b.instructor_areas)
        ? b.instructor_areas
        : typeof b.instructor_areas === 'string'
          ? [b.instructor_areas]
          : [],
    },
    pendingReschedule: null as null | {
      id: string;
      requestedByRole: string;
      requesterName: string | null;
      proposedDateTime: string;
      reason: string | null;
    },
  }));

  const pending = await fetchPendingReschedules(bookings.map((b) => b.id));
  for (const b of bookings) {
    const r = pending[b.id];
    if (r) {
      b.pendingReschedule = {
        id: r.id,
        requestedByRole: r.requestedByRole,
        requesterName: r.requesterName,
        proposedDateTime: r.proposedDateTime.toISOString(),
        reason: r.reason,
      };
    }
  }

  return bookings;
};

type CreateBookingInput = {
  studentId: string;
  lessonType: string;
  transmission?: string;
  instructorId?: string;
  scheduledAt?: string;
  durationMins: number;
  packageId: string;
  voucherCode?: string;
  couponCode?: string;
  notes?: string;
};

const createForStudent = async (input: CreateBookingInput) => {
  const resolved = await pricingService.resolvePackageForBooking(input.lessonType, input.packageId);
  if (!resolved) {
    return null;
  }

  const reference = generateBookingReference();
  const id = uuidv4();
  const now = new Date();

  // THEORY bookings have no instructor or scheduled time — use now as placeholder scheduledAt
  const isTheory = input.lessonType === 'THEORY';
  const scheduledAt = input.scheduledAt ?? now.toISOString();
  const transmission = input.transmission ?? 'manual';

  // 60-day booking horizon (matches Google Cal sync window)
  if (!isTheory) {
    const scheduled = new Date(scheduledAt);
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + MAX_BOOKING_HORIZON_DAYS);
    if (scheduled > horizon) {
      return { horizonExceeded: true as const };
    }
    if (scheduled < now) {
      return { pastDate: true as const };
    }
    if (input.instructorId) {
      const available = await isWithinAvailability(input.instructorId, scheduled, input.durationMins);
      if (!available) {
        return { outsideAvailability: true as const };
      }
    }
  }

  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Booking" (
        id, reference, "studentId", "instructorId", "lessonType", transmission, "scheduledAt",
        "durationMins", status, "paymentStatus", "totalAmount", "pricingPackageId",
        "voucherCode", "couponCode", notes, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5::"LessonType", $6, $7::timestamp,
        $8, 'PENDING', 'UNPAID', $9::decimal, $10,
        $11, $12, $13, $14::timestamp, $15::timestamp
      )`,
      id,
      reference,
      input.studentId,
      isTheory ? null : (input.instructorId ?? null),
      input.lessonType,
      transmission,
      scheduledAt,
      input.durationMins,
      resolved.totalAmount.toFixed(2),
      resolved.packageId,
      input.voucherCode ?? null,
      input.couponCode ?? null,
      input.notes ?? null,
      now.toISOString(),
      now.toISOString()
    );
  } catch (err: any) {
    if (String(err?.message ?? '').includes('booking_no_overlap')) {
      return { conflict: true as const };
    }
    throw err;
  }

  return {
    id,
    reference,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
  };
};

const cancelForStudent = async (bookingId: string, studentId: string, reason: string) => {
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      studentId: string;
      status: string;
      paymentStatus: string;
      scheduledAt: Date;
    }>
  >(
    `SELECT id, "studentId", status, "paymentStatus", "scheduledAt" FROM "Booking" WHERE id = $1 LIMIT 1`,
    bookingId
  );
  const booking = rows[0];
  if (!booking) {
    return { error: 'NOT_FOUND' as const };
  }
  if (booking.studentId !== studentId) {
    return { error: 'FORBIDDEN' as const };
  }
  if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
    return { error: 'BAD_STATE' as const };
  }

  const hoursUntilLesson = (booking.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
  const eligibleForRefund = hoursUntilLesson >= 24;

  await prisma.$executeRawUnsafe(
    `UPDATE "Booking"
     SET status = 'CANCELLED', "cancellationReason" = $2, "updatedAt" = $3::timestamp
     WHERE id = $1`,
    bookingId,
    reason,
    new Date().toISOString()
  );

  // Cancel any pending reschedule requests
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "RescheduleRequest" SET status = 'CANCELLED', "updatedAt" = NOW() WHERE "bookingId" = $1 AND status = 'PENDING'`,
      bookingId
    );
  } catch { /* RescheduleRequest table may not exist */ }

  // Issue full Stripe refund if cancelled more than 24h before lesson
  let refundResult: { refunded: boolean; stripeRefundId?: string } = { refunded: false };
  if (eligibleForRefund && booking.paymentStatus === 'PAID') {
    const result = await refundService.issueRefundForBooking(bookingId);
    if (result.refunded) {
      refundResult = { refunded: true, stripeRefundId: result.stripeRefundId };
    }
  }

  // Remove from Google Calendar for both parties (fire-and-forget)
  void (async () => {
    try {
      const cancelParties = await prisma.$queryRawUnsafe<
        Array<{ studentId: string; instructorUserId: string | null }>
      >(
        `SELECT b."studentId", u.id AS "instructorUserId"
         FROM "Booking" b
         LEFT JOIN "Instructor" i ON i.id = b."instructorId"
         LEFT JOIN users u ON u.id = i."userId"
         WHERE b.id = $1 LIMIT 1`,
        bookingId
      );
      const p = cancelParties[0];
      if (p) {
        await googleCalendarService.broadcastBookingDeleted({
          studentId: p.studentId,
          instructorUserId: p.instructorUserId,
          bookingId,
        });
      }
    } catch { /* non-critical */ }
  })();

  // Send cancellation emails (fire-and-forget)
  void (async () => {
    try {
      const details = await prisma.$queryRawUnsafe<Array<{
        reference: string;
        studentName: string; studentEmail: string;
        instructorName: string | null; instructorEmail: string | null;
        lessonType: string; scheduledAt: Date; totalAmount: string; discountAmount: string | null;
      }>>(
        `SELECT b.reference,
                su.name AS "studentName", su.email AS "studentEmail",
                iu.name AS "instructorName", iu.email AS "instructorEmail",
                b."lessonType", b."scheduledAt", b."totalAmount"::text,
                b."discountAmount"::text AS "discountAmount"
         FROM "Booking" b
         INNER JOIN users su ON su.id = b."studentId"
         LEFT  JOIN "Instructor" i ON i.id = b."instructorId"
         LEFT  JOIN users iu ON iu.id = i."userId"
         WHERE b.id = $1 LIMIT 1`,
        bookingId
      );
      const d = details[0];
      if (d) {
        const paidAmount = Math.max(0, Number(d.totalAmount) - Number(d.discountAmount ?? 0));
        await emailService.sendBookingCancellationEmail({
          to: d.studentEmail,
          studentName: d.studentName,
          reference: d.reference,
          lessonType: d.lessonType,
          scheduledAt: new Date(d.scheduledAt),
          refunded: refundResult.refunded,
          refundAmount: refundResult.refunded ? paidAmount : undefined,
        });
        if (refundResult.refunded) {
          await emailService.sendRefundConfirmationEmail({
            to: d.studentEmail,
            studentName: d.studentName,
            reference: d.reference,
            refundAmount: paidAmount,
            scheduledAt: new Date(d.scheduledAt),
          });
        }
        if (d.instructorEmail) {
          await emailService.sendInstructorBookingCancellationEmail({
            to: d.instructorEmail,
            instructorName: d.instructorName ?? 'Instructor',
            studentName: d.studentName,
            reference: d.reference,
            scheduledAt: new Date(d.scheduledAt),
            reason,
          });
        }
      }
    } catch { /* email failure must not break cancellation */ }
  })();

  return {
    data: {
      id: bookingId,
      status: 'CANCELLED' as const,
      refund: refundResult,
      noRefundReason: !eligibleForRefund ? 'Cancelled within 24 hours of lesson — no refund issued' : undefined,
    },
  };
};

const createRescheduleRequest = async (
  bookingId: string,
  studentId: string,
  params: { proposedDateTime: string; reason: string; notes?: string }
) => {
  const rows = await prisma.$queryRawUnsafe<Array<{ studentId: string }>>(
    `SELECT "studentId" FROM "Booking" WHERE id = $1 LIMIT 1`,
    bookingId
  );
  if (!rows[0]) return { error: 'NOT_FOUND' as const };
  if (rows[0].studentId !== studentId) return { error: 'FORBIDDEN' as const };

  return rescheduleService.createRequest({
    bookingId,
    requestedByUserId: studentId,
    requestedByRole: 'STUDENT',
    proposedDateTime: params.proposedDateTime,
    reason: params.reason,
    notes: params.notes,
  });
};

const respondToRescheduleRequest = async (
  requestId: string,
  studentId: string
) => {
  const rows = await prisma.$queryRawUnsafe<
    Array<{ bookingId: string; requestedByRole: string }>
  >(
    `SELECT rr."bookingId", rr."requestedByRole"
     FROM "RescheduleRequest" rr
     INNER JOIN "Booking" b ON b.id = rr."bookingId"
     WHERE rr.id = $1 AND b."studentId" = $2
     LIMIT 1`,
    requestId,
    studentId
  );
  if (!rows[0]) return { error: 'FORBIDDEN' as const };

  return { data: rows[0] };
};

const getAvailability = async (
  instructorId: string,
  startDateStr: string,
  endDateStr: string,
  durationMins = 60
) => {
  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    select: { availabilityMode: true },
  });
  if (!instructor) return null;
  const mode = instructor.availabilityMode;

  const horizon = moment().add(MAX_BOOKING_HORIZON_DAYS, 'day').endOf('day').toDate();
  const requestedEnd = moment(endDateStr).endOf('day').toDate();
  const rangeStart = moment(startDateStr).startOf('day').toDate();
  const rangeEnd = requestedEnd > horizon ? horizon : requestedEnd;

  const [bookings, busy, templateRows] = await Promise.all([
    prisma.booking.findMany({
      where: {
        instructorId,
        status: { in: ['CONFIRMED', 'PENDING'] as any },
        scheduledAt: { gte: rangeStart, lte: rangeEnd },
      },
      select: { scheduledAt: true, durationMins: true },
    }),
    mode === 'CALENDAR_SYNC'
      ? prisma.instructorBusyBlock.findMany({
          where: {
            instructorId,
            startsAt: { lte: rangeEnd },
            endsAt: { gte: rangeStart },
          },
          select: { startsAt: true, endsAt: true },
        })
      : Promise.resolve([] as Array<{ startsAt: Date; endsAt: Date }>),
    mode === 'CUSTOM_SLOTS'
      ? prisma.$queryRawUnsafe<Array<{ dayOfWeek: number; startTime: string; endTime: string }>>(
          `SELECT "dayOfWeek", "startTime", "endTime" FROM "Availability" WHERE "instructorId" = $1 AND "isAvailable" = true`,
          instructorId
        )
      : Promise.resolve([] as Array<{ dayOfWeek: number; startTime: string; endTime: string }>),
  ]);

  const rawTemplateByDay = new Map<number, DayWindow[]>();
  for (const row of templateRows) {
    const start = parseHHMM(row.startTime.slice(0, 5));
    const end = parseHHMM(row.endTime.slice(0, 5));
    if (start === null || end === null || end <= start) continue;
    const list = rawTemplateByDay.get(row.dayOfWeek) ?? [];
    list.push({ start, end });
    rawTemplateByDay.set(row.dayOfWeek, list);
  }
  const templateByDay = new Map<number, DayWindow[]>();
  for (const [day, windows] of rawTemplateByDay) {
    templateByDay.set(day, mergeWindows(windows));
  }

  const blockersByDate = new Map<string, Array<{ start: number; end: number }>>();
  const addBlocker = (start: Date, end: Date) => {
    let cursorDay = moment(start).startOf('day');
    const finalDay = moment(end).startOf('day');
    while (cursorDay.isSameOrBefore(finalDay)) {
      const dateKey = cursorDay.format('YYYY-MM-DD');
      const dayStart = cursorDay.clone().valueOf();
      const dayEnd = cursorDay.clone().add(1, 'day').valueOf();
      const segStart = Math.max(start.getTime(), dayStart);
      const segEnd = Math.min(end.getTime(), dayEnd);
      if (segEnd > segStart) {
        const startMins = Math.floor((segStart - dayStart) / 60000);
        const endMins = Math.ceil((segEnd - dayStart) / 60000);
        const list = blockersByDate.get(dateKey) ?? [];
        list.push({ start: startMins, end: endMins });
        blockersByDate.set(dateKey, list);
      }
      cursorDay = cursorDay.clone().add(1, 'day');
    }
  };
  for (const b of bookings) {
    addBlocker(b.scheduledAt, new Date(b.scheduledAt.getTime() + b.durationMins * 60_000));
  }
  for (const b of busy) {
    addBlocker(b.startsAt, b.endsAt);
  }

  const nowMs = Date.now();
  const result: { date: string; slots: string[] }[] = [];
  let cursor = moment(rangeStart).startOf('day');
  const end = moment(rangeEnd).startOf('day');

  while (cursor.isSameOrBefore(end)) {
    const dateStr = cursor.format('YYYY-MM-DD');
    const blockers = blockersByDate.get(dateStr) ?? [];
    const slots: string[] = [];
    const windows = getDayWindows(mode, cursor.day(), templateByDay);

    for (const window of windows) {
      let t = window.start;
      while (t + durationMins <= window.end) {
        const slotEnd = t + durationMins;
        const conflict = blockers.some(b => overlaps(t, slotEnd, b.start, b.end));
        if (!conflict) {
          const slotAt = cursor.clone().hour(Math.floor(t / 60)).minute(t % 60).second(0).valueOf();
          if (slotAt > nowMs) {
            slots.push(formatHHMM(t));
          }
        }
        t += SLOT_STEP_MINS;
      }
    }

    result.push({ date: dateStr, slots });
    cursor = cursor.clone().add(1, 'day');
  }

  return result;
};

export default {
  listForStudent,
  createForStudent,
  cancelForStudent,
  createRescheduleRequest,
  respondToRescheduleRequest,
  getAvailability,
};
