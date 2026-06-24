import { v4 as uuidv4 } from 'uuid';
import prisma from '../client';
import googleCalendarService from './googleCalendar.service';
import emailService from './email.service';

type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

const createRequest = async (params: {
  bookingId: string;
  requestedByUserId: string;
  requestedByRole: Role;
  proposedDateTime: string;
  reason: string;
  notes?: string;
}) => {
  const bookings = await prisma.$queryRawUnsafe<
    Array<{ id: string; status: string; studentId: string; instructorId: string }>
  >(
    `SELECT id, status::text AS status, "studentId", "instructorId" FROM "Booking" WHERE id = $1 LIMIT 1`,
    params.bookingId
  );
  const booking = bookings[0];
  if (!booking) return { error: 'NOT_FOUND' as const };
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) return { error: 'BAD_STATE' as const };

  // Cancel any existing PENDING reschedule requests for this booking
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "RescheduleRequest" SET status = 'CANCELLED'::"RescheduleStatus", "updatedAt" = NOW() WHERE "bookingId" = $1 AND status = 'PENDING'::"RescheduleStatus"`,
      params.bookingId
    );
  } catch { /* table may not exist */ }

  // Admin always reschedules directly — no approval needed
  if (params.requestedByRole === 'ADMIN') {
    await prisma.$executeRawUnsafe(
      `UPDATE "Booking" SET "scheduledAt" = $2::timestamp, notes = COALESCE($3::text, notes), "updatedAt" = NOW() WHERE id = $1`,
      params.bookingId,
      params.proposedDateTime,
      params.notes ?? null
    );
    return { data: { type: 'DIRECT' as const, bookingId: params.bookingId } };
  }

  const id = uuidv4();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "RescheduleRequest"
       (id, "bookingId", "requestedByUserId", "requestedByRole", "proposedDateTime", reason, notes, status, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5::timestamp, $6, $7, 'PENDING'::"RescheduleStatus", NOW(), NOW())`,
    id,
    params.bookingId,
    params.requestedByUserId,
    params.requestedByRole,
    params.proposedDateTime,
    params.reason,
    params.notes ?? null
  );

  // Notify the other party (fire-and-forget)
  void (async () => {
    try {
      const details = await prisma.$queryRawUnsafe<Array<{
        scheduledAt: Date;
        studentName: string; studentEmail: string;
        instructorName: string | null; instructorEmail: string | null;
        reference: string;
      }>>(
        `SELECT b."scheduledAt", b.reference,
                su.name AS "studentName", su.email AS "studentEmail",
                iu.name AS "instructorName", iu.email AS "instructorEmail"
         FROM "Booking" b
         INNER JOIN users su ON su.id = b."studentId"
         LEFT JOIN "Instructor" inst ON inst.id = b."instructorId"
         LEFT JOIN users iu ON iu.id = inst."userId"
         WHERE b.id = $1 LIMIT 1`,
        params.bookingId
      );
      const d = details[0];
      if (!d) return;

      const proposedDate = new Date(params.proposedDateTime);
      const requesterName = params.requestedByRole === 'STUDENT' ? d.studentName : (d.instructorName ?? 'Instructor');

      if (params.requestedByRole === 'STUDENT' && d.instructorEmail) {
        await emailService.sendRescheduleRequestEmail({
          to: d.instructorEmail,
          recipientName: d.instructorName ?? 'Instructor',
          requesterName: d.studentName,
          requesterRole: 'student',
          reference: d.reference,
          currentDate: new Date(d.scheduledAt),
          proposedDate,
          reason: params.reason,
        });
      } else if (params.requestedByRole === 'INSTRUCTOR') {
        await emailService.sendRescheduleRequestEmail({
          to: d.studentEmail,
          recipientName: d.studentName,
          requesterName: d.instructorName ?? 'Instructor',
          requesterRole: 'instructor',
          reference: d.reference,
          currentDate: new Date(d.scheduledAt),
          proposedDate,
          reason: params.reason,
        });
      }
    } catch { /* non-critical */ }
  })();

  return { data: { type: 'REQUEST' as const, requestId: id } };
};

const respondToRequest = async (params: {
  requestId: string;
  respondedByUserId: string;
  respondedByRole: Role;
  accept: boolean;
}) => {
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      bookingId: string;
      requestedByRole: string;
      requestedByUserId: string;
      proposedDateTime: Date;
      status: string;
    }>
  >(
    `SELECT id, "bookingId", "requestedByRole", "requestedByUserId", "proposedDateTime", status::text AS status
     FROM "RescheduleRequest" WHERE id = $1 LIMIT 1`,
    params.requestId
  );
  const req = rows[0];
  if (!req) return { error: 'NOT_FOUND' as const };
  if (req.status !== 'PENDING') return { error: 'BAD_STATE' as const };

  // Responder must be the other party (not the requester's role)
  const isAuthorised =
    (req.requestedByRole === 'STUDENT' && params.respondedByRole === 'INSTRUCTOR') ||
    (req.requestedByRole === 'INSTRUCTOR' && params.respondedByRole === 'STUDENT') ||
    params.respondedByRole === 'ADMIN';
  if (!isAuthorised) return { error: 'FORBIDDEN' as const };

  const newStatus = params.accept ? 'ACCEPTED' : 'DECLINED';

  await prisma.$executeRawUnsafe(
    `UPDATE "RescheduleRequest"
     SET status = $2::"RescheduleStatus", "respondedAt" = NOW(), "respondedByUserId" = $3, "updatedAt" = NOW()
     WHERE id = $1`,
    params.requestId,
    newStatus,
    params.respondedByUserId
  );

  if (params.accept) {
    await prisma.$executeRawUnsafe(
      `UPDATE "Booking" SET "scheduledAt" = $2::timestamp, "updatedAt" = NOW() WHERE id = $1`,
      req.bookingId,
      req.proposedDateTime.toISOString()
    );

    // Update Google Calendar event with new time (fire-and-forget)
    const bookingRows = await prisma.$queryRawUnsafe<
      Array<{ studentId: string; reference: string; lessonType: string; durationMins: number; instructorName: string | null }>
    >(
      `SELECT b."studentId", b.reference, b."lessonType", b."durationMins",
              u.name AS "instructorName"
       FROM "Booking" b
       LEFT JOIN "Instructor" i ON i.id = b."instructorId"
       LEFT JOIN users u ON u.id = i."userId"
       WHERE b.id = $1 LIMIT 1`,
      req.bookingId
    );
    const bRow = bookingRows[0];
    if (bRow) {
      googleCalendarService.updateCalendarEvent(bRow.studentId, {
        bookingId: req.bookingId,
        reference: bRow.reference,
        lessonType: bRow.lessonType,
        instructorName: bRow.instructorName ?? 'AutoPilot Instructor',
        scheduledAt: new Date(req.proposedDateTime),
        durationMins: bRow.durationMins,
      }).catch(() => {});
    }
  }

  // Send accepted/declined email to the requester (fire-and-forget)
  void (async () => {
    try {
      const details = await prisma.$queryRawUnsafe<Array<{
        scheduledAt: Date; reference: string;
        studentName: string; studentEmail: string;
        instructorName: string | null; instructorEmail: string | null;
        durationMins: number;
      }>>(
        `SELECT b."scheduledAt", b.reference, b."durationMins",
                su.name AS "studentName", su.email AS "studentEmail",
                iu.name AS "instructorName", iu.email AS "instructorEmail"
         FROM "Booking" b
         INNER JOIN users su ON su.id = b."studentId"
         LEFT JOIN "Instructor" inst ON inst.id = b."instructorId"
         LEFT JOIN users iu ON iu.id = inst."userId"
         WHERE b.id = $1 LIMIT 1`,
        req.bookingId
      );
      const d = details[0];
      if (!d) return;

      const requesterEmail = req.requestedByRole === 'STUDENT' ? d.studentEmail : (d.instructorEmail ?? null);
      const requesterName = req.requestedByRole === 'STUDENT' ? d.studentName : (d.instructorName ?? 'Instructor');
      if (!requesterEmail) return;

      if (params.accept) {
        await emailService.sendRescheduleAcceptedEmail({
          to: requesterEmail,
          recipientName: requesterName,
          reference: d.reference,
          newDate: new Date(req.proposedDateTime),
          instructorName: d.instructorName ?? 'AutoPilot Instructor',
          durationMins: d.durationMins,
        });
      } else {
        await emailService.sendRescheduleDeclinedEmail({
          to: requesterEmail,
          recipientName: requesterName,
          reference: d.reference,
          originalDate: new Date(d.scheduledAt),
        });
      }
    } catch { /* non-critical */ }
  })();

  return {
    data: { requestId: params.requestId, status: newStatus, bookingId: req.bookingId },
  };
};

const getPendingForBooking = async (bookingId: string) => {
  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        requestedByRole: string;
        requestedByUserId: string;
        requesterName: string | null;
        proposedDateTime: Date;
        reason: string | null;
        notes: string | null;
        createdAt: Date;
      }>
    >(
      `SELECT r.id, r."requestedByRole", r."requestedByUserId",
              u.name AS "requesterName",
              r."proposedDateTime", r.reason, r.notes, r."createdAt"
       FROM "RescheduleRequest" r
       LEFT JOIN users u ON u.id = r."requestedByUserId"
       WHERE r."bookingId" = $1 AND r.status = 'PENDING'::"RescheduleStatus"
       ORDER BY r."createdAt" DESC LIMIT 1`,
      bookingId
    );
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      id: r.id,
      requestedByRole: r.requestedByRole,
      requestedByUserId: r.requestedByUserId,
      requesterName: r.requesterName,
      proposedDateTime: r.proposedDateTime.toISOString(),
      reason: r.reason,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
};

export default {
  createRequest,
  respondToRequest,
  getPendingForBooking,
};
