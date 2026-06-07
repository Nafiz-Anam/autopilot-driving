import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../client';
import pricingService from './pricing.service';
import { generateBookingReference } from '../utils/bookingReference';
import refundService from './refund.service';

const ALL_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

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

  return rows.map((b) => ({
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
  }));
};

type CreateBookingInput = {
  studentId: string;
  lessonType: string;
  transmission: string;
  instructorId: string;
  scheduledAt: string;
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
    input.instructorId,
    input.lessonType,
    input.transmission,
    input.scheduledAt,
    input.durationMins,
    resolved.totalAmount.toFixed(2),
    resolved.packageId,
    input.voucherCode ?? null,
    input.couponCode ?? null,
    input.notes ?? null,
    now.toISOString(),
    now.toISOString()
  );

  return {
    id,
    reference,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
  };
};

const cancelForStudent = async (bookingId: string, studentId: string) => {
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
  if (hoursUntilLesson < 24) {
    return { error: 'WITHIN_24H' as const };
  }

  await prisma.$executeRawUnsafe(
    `UPDATE "Booking" SET status = 'CANCELLED', "updatedAt" = $2::timestamp WHERE id = $1`,
    bookingId,
    new Date().toISOString()
  );

  // Auto-refund if the booking was paid (cancelled more than 24h before lesson)
  let refundResult: { refunded: boolean; stripeRefundId?: string } = { refunded: false };
  if (booking.paymentStatus === 'PAID') {
    const result = await refundService.issueRefundForBooking(bookingId);
    if (result.refunded) {
      refundResult = { refunded: true, stripeRefundId: result.stripeRefundId };
    }
  }

  return { data: { id: bookingId, status: 'CANCELLED' as const, refund: refundResult } };
};

const getAvailability = async (instructorId: string, startDateStr: string, endDateStr: string) => {
  const startDate = moment(startDateStr).toDate();
  const endDate = moment(endDateStr).toDate();

  const availabilityPatterns = await prisma.$queryRawUnsafe<Array<{ dayOfWeek: number }>>(
    `SELECT "dayOfWeek" FROM "Availability" WHERE "instructorId" = $1 AND "isAvailable" = true`,
    instructorId
  );

  const existingBookings = await prisma.$queryRawUnsafe<Array<{ scheduledAt: Date }>>(
    `SELECT "scheduledAt" FROM "Booking"
     WHERE "instructorId" = $1
       AND "scheduledAt" >= $2::timestamp
       AND "scheduledAt" <= $3::timestamp
       AND status IN ('CONFIRMED', 'PENDING')`,
    instructorId,
    moment(startDateStr).toISOString(),
    moment(endDateStr).add(1, 'day').toISOString()
  );

  const bookedSlots = new Set<string>();
  for (const booking of existingBookings) {
    const dateStr = moment(booking.scheduledAt).format('YYYY-MM-DD');
    const timeStr = moment(booking.scheduledAt).format('HH:mm');
    bookedSlots.add(`${dateStr} ${timeStr}`);
  }

  const result: { date: string; slots: string[] }[] = [];
  let current = moment(startDate).startOf('day');
  const end = moment(endDate).startOf('day');

  while (current.isSameOrBefore(end)) {
    const dayOfWeek = current.day();
    const dateStr = current.format('YYYY-MM-DD');
    const pattern = availabilityPatterns.find((p) => p.dayOfWeek === dayOfWeek);

    if (pattern) {
      const availableSlots = ALL_SLOTS.filter((slot) => !bookedSlots.has(`${dateStr} ${slot}`));
      result.push({ date: dateStr, slots: availableSlots });
    } else {
      result.push({ date: dateStr, slots: [] });
    }
    current = current.clone().add(1, 'day');
  }

  return result;
};

export default {
  listForStudent,
  createForStudent,
  cancelForStudent,
  getAvailability,
};
