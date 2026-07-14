import prisma from '../client';
import refundService from './refund.service';
import emailService from './email.service';
import instructorAvailabilityModeService from './instructorAvailabilityMode.service';

type InstructorProfileRow = {
  instructor: Record<string, unknown>;
  userId: string;
  userName: string | null;
  userEmail: string;
  userPhone: string | null;
  userImage: string | null;
};

type AvailabilityInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const getInstructorProfileByUserId = async (userId: string) => {
  const rows = await prisma.$queryRawUnsafe<InstructorProfileRow[]>(
    `SELECT
       to_jsonb(i) AS instructor,
       u.id AS "userId",
       u.name AS "userName",
       u.email AS "userEmail",
       u.phone AS "userPhone",
       u."profilePicture" AS "userImage"
     FROM "Instructor" i
     INNER JOIN users u ON u.id = i."userId"
     WHERE i."userId" = $1
     LIMIT 1`,
    userId
  );

  const row = rows[0];
  if (!row) return null;

  const instructor = row.instructor ?? {};
  return {
    ...instructor,
    pricePerHour: Number((instructor as Record<string, unknown>).pricePerHour ?? 0),
    user: {
      id: row.userId,
      name: row.userName,
      email: row.userEmail,
      phone: row.userPhone,
      image: row.userImage,
    },
  };
};

const updateInstructorProfileByUserId = async (userId: string, body: Record<string, unknown>) => {
  const instructorRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "Instructor" WHERE "userId" = $1 LIMIT 1`,
    userId
  );
  const instructor = instructorRows[0];
  if (!instructor) return null;

  if (body.availabilityMode !== undefined) {
    await instructorAvailabilityModeService.assertSafeModeSwitch(
      instructor.id,
      body.availabilityMode as 'CUSTOM_SLOTS' | 'CALENDAR_SYNC',
      body.force === true
    );
  }

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (body.bio !== undefined) {
    setClauses.push(`bio = $${idx}`);
    values.push(body.bio);
    idx++;
  }
  if (body.pricePerHour !== undefined) {
    setClauses.push(`"pricePerHour" = $${idx}`);
    values.push(body.pricePerHour);
    idx++;
  }
  if (body.areas !== undefined) {
    setClauses.push(`areas = $${idx}`);
    values.push(body.areas);
    idx++;
  }
  if (body.transmission !== undefined) {
    setClauses.push(`transmission = $${idx}`);
    values.push(body.transmission);
    idx++;
  }
  if (body.yearsExp !== undefined) {
    setClauses.push(`"yearsExp" = $${idx}`);
    values.push(body.yearsExp);
    idx++;
  }
  if (body.licenceNumber !== undefined) {
    setClauses.push(`"licenceNumber" = $${idx}`);
    values.push(body.licenceNumber);
    idx++;
  }
  if (body.isFemale !== undefined) {
    setClauses.push(`"isFemale" = $${idx}`);
    values.push(body.isFemale);
    idx++;
  }
  if (body.availabilityMode !== undefined) {
    setClauses.push(`"availabilityMode" = $${idx}::"AvailabilityMode"`);
    values.push(body.availabilityMode);
    idx++;
  }

  if (setClauses.length > 0) {
    await prisma.$executeRawUnsafe(
      `UPDATE "Instructor" SET ${setClauses.join(', ')} WHERE id = $${idx}`,
      ...values,
      instructor.id
    );
  }

  if (body.name !== undefined || body.phone !== undefined) {
    const userSet: string[] = [];
    const userVals: unknown[] = [];
    let ui = 1;
    if (body.name !== undefined) {
      userSet.push(`name = $${ui}`);
      userVals.push(body.name);
      ui++;
    }
    if (body.phone !== undefined) {
      userSet.push(`phone = $${ui}`);
      userVals.push(body.phone);
      ui++;
    }
    await prisma.$executeRawUnsafe(
      `UPDATE users SET ${userSet.join(', ')}, "updatedAt" = NOW() WHERE id = $${ui}`,
      ...userVals,
      userId
    );
  }

  return getInstructorProfileByUserId(userId);
};

const getInstructorScheduleByUserId = async (userId: string) => {
  const instructorRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "Instructor" WHERE "userId" = $1 LIMIT 1`,
    userId
  );
  const instructor = instructorRows[0];
  if (!instructor) return null;

  const availabilityRows = await prisma.$queryRawUnsafe<Array<{ row: Record<string, unknown> }>>(
    `SELECT to_jsonb(a) AS row
     FROM "Availability" a
     WHERE a."instructorId" = $1
     ORDER BY a."dayOfWeek" ASC, a."startTime" ASC`,
    instructor.id
  );

  return availabilityRows.map(a => a.row);
};

const getScheduleOverviewByUserId = async (userId: string, fromStr: string, toStr: string) => {
  const instructorRows = await prisma.$queryRawUnsafe<
    Array<{ id: string; availabilityMode: string }>
  >(
    `SELECT id, "availabilityMode"::text AS "availabilityMode" FROM "Instructor" WHERE "userId" = $1 LIMIT 1`,
    userId
  );
  const instructor = instructorRows[0];
  if (!instructor) return null;

  const from = new Date(fromStr + 'T00:00:00Z');
  const to = new Date(toStr + 'T23:59:59Z');

  const [bookings, busy, integration] = await Promise.all([
    prisma.$queryRawUnsafe<
      Array<{
        id: string;
        reference: string;
        scheduledAt: Date;
        durationMins: number;
        status: string;
        studentName: string | null;
      }>
    >(
      `SELECT b.id, b.reference, b."scheduledAt", b."durationMins", b.status::text AS status,
              su.name AS "studentName"
       FROM "Booking" b
       INNER JOIN users su ON su.id = b."studentId"
       WHERE b."instructorId" = $1
         AND b.status IN ('PENDING', 'CONFIRMED')
         AND b."scheduledAt" >= $2::timestamp
         AND b."scheduledAt" <= $3::timestamp
       ORDER BY b."scheduledAt" ASC`,
      instructor.id,
      from.toISOString(),
      to.toISOString()
    ),
    prisma.instructorBusyBlock.findMany({
      where: {
        instructorId: instructor.id,
        startsAt: { lte: to },
        endsAt: { gte: from },
      },
      orderBy: { startsAt: 'asc' },
      select: { id: true, startsAt: true, endsAt: true, isAllDay: true, source: true },
    }),
    prisma.userIntegration.findUnique({
      where: { userId_provider: { userId, provider: 'google_calendar' } },
      select: { enabled: true, externalEmail: true },
    }),
  ]);

  return {
    from: fromStr,
    to: toStr,
    availabilityMode: instructor.availabilityMode,
    calendarConnected: !!integration?.enabled,
    calendarEmail: integration?.externalEmail ?? null,
    bookings: bookings.map(b => ({
      id: b.id,
      reference: b.reference,
      scheduledAt: b.scheduledAt.toISOString(),
      durationMins: b.durationMins,
      status: b.status,
      studentName: b.studentName,
    })),
    busy: busy.map(b => ({
      id: b.id,
      startsAt: b.startsAt.toISOString(),
      endsAt: b.endsAt.toISOString(),
      isAllDay: b.isAllDay,
      source: b.source,
    })),
  };
};

const replaceInstructorScheduleByUserId = async (userId: string, slots: AvailabilityInput[]) => {
  const instructorRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "Instructor" WHERE "userId" = $1 LIMIT 1`,
    userId
  );
  const instructor = instructorRows[0];
  if (!instructor) return null;

  await prisma.$transaction([
    prisma.$executeRawUnsafe(`DELETE FROM "Availability" WHERE "instructorId" = $1`, instructor.id),
    ...slots.map(slot =>
      prisma.$executeRawUnsafe(
        `INSERT INTO "Availability" (
          id, "instructorId", "dayOfWeek", "startTime", "endTime", "isAvailable"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3::time, $4::time, $5
        )`,
        instructor.id,
        slot.dayOfWeek,
        slot.startTime,
        slot.endTime,
        slot.isAvailable
      )
    ),
  ]);

  return { success: true, count: slots.length };
};

const getInstructorStudentsByUserId = async (userId: string) => {
  const instructorRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "Instructor" WHERE "userId" = $1 LIMIT 1`,
    userId
  );
  const instructor = instructorRows[0];
  if (!instructor) return null;

  const bookings = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      studentId: string;
      scheduledAt: Date;
      lessonType: string;
      durationMins: number;
      status: string;
      notes: string | null;
      studentName: string | null;
      studentEmail: string;
      studentPhone: string | null;
      studentImage: string | null;
    }>
  >(
    `SELECT
       b.id,
       b."studentId",
       b."scheduledAt",
       b."lessonType"::text AS "lessonType",
       b."durationMins",
       b.status::text AS status,
       b.notes,
       u.name AS "studentName",
       u.email AS "studentEmail",
       u.phone AS "studentPhone",
       u."profilePicture" AS "studentImage"
     FROM "Booking" b
     INNER JOIN users u ON u.id = b."studentId"
     WHERE b."instructorId" = $1
     ORDER BY b."scheduledAt" DESC`,
    instructor.id
  );

  const studentMap = new Map<
    string,
    {
      student: {
        id: string;
        name: string | null;
        email: string;
        phone: string | null;
        image: string | null;
      };
      bookings: typeof bookings;
    }
  >();

  for (const booking of bookings) {
    const sid = booking.studentId;
    if (!studentMap.has(sid)) {
      studentMap.set(sid, {
        student: {
          id: sid,
          name: booking.studentName,
          email: booking.studentEmail,
          phone: booking.studentPhone,
          image: booking.studentImage,
        },
        bookings: [],
      });
    }
    studentMap.get(sid)!.bookings.push(booking);
  }

  return Array.from(studentMap.values()).map(({ student, bookings: sb }) => {
    const completedLessons = sb.filter(b => b.status === 'COMPLETED').length;
    const lastLesson = sb[0]?.scheduledAt?.toISOString() ?? null;
    const progress = Math.min(Math.round((completedLessons / 20) * 100), 100);
    const recentBookings = sb.slice(0, 5).map(b => ({
      date: b.scheduledAt.toISOString(),
      lessonType: b.lessonType,
      durationMins: b.durationMins,
      status: b.status,
      notes: b.notes ?? null,
    }));

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      image: student.image,
      totalLessons: sb.length,
      completedLessons,
      lastLesson,
      progress,
      recentBookings,
    };
  });
};

const getInstructorStatsByUserId = async (userId: string) => {
  const instructorRows = await prisma.$queryRawUnsafe<
    Array<{ id: string; rating: number; areas: string[] | null }>
  >(`SELECT id, rating, areas FROM "Instructor" WHERE "userId" = $1 LIMIT 1`, userId);
  const instructor = instructorRows[0];
  if (!instructor) return null;

  const now = new Date();

  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const next7Days = new Date(now);
  next7Days.setDate(now.getDate() + 7);

  const [
    lessonsThisWeekRows,
    monthBookings,
    allBookingsForStudents,
    todayBookings,
    upcomingBookings,
  ] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `SELECT COUNT(*)::int AS count
         FROM "Booking"
         WHERE "instructorId" = $1
           AND "scheduledAt" >= $2::timestamp
           AND "scheduledAt" < $3::timestamp
           AND status::text IN ('CONFIRMED', 'COMPLETED')`,
      instructor.id,
      weekStart.toISOString(),
      weekEnd.toISOString()
    ),
    prisma.$queryRawUnsafe<Array<{ totalAmount: string }>>(
      `SELECT "totalAmount"::text AS "totalAmount"
         FROM "Booking"
         WHERE "instructorId" = $1
           AND "scheduledAt" >= $2::timestamp
           AND "paymentStatus"::text = 'PAID'`,
      instructor.id,
      monthStart.toISOString()
    ),
    prisma.$queryRawUnsafe<Array<{ studentId: string }>>(
      `SELECT "studentId" FROM "Booking" WHERE "instructorId" = $1`,
      instructor.id
    ),
    prisma.$queryRawUnsafe<
      Array<{
        id: string;
        scheduledAt: Date;
        durationMins: number;
        lessonType: string;
        transmission: string;
        studentName: string | null;
      }>
    >(
      `SELECT
           b.id,
           b."scheduledAt",
           b."durationMins",
           b."lessonType"::text AS "lessonType",
           b.transmission,
           u.name AS "studentName"
         FROM "Booking" b
         INNER JOIN users u ON u.id = b."studentId"
         WHERE b."instructorId" = $1
           AND b."scheduledAt" >= $2::timestamp
           AND b."scheduledAt" <= $3::timestamp
           AND b.status::text IN ('CONFIRMED', 'PENDING')
         ORDER BY b."scheduledAt" ASC`,
      instructor.id,
      todayStart.toISOString(),
      todayEnd.toISOString()
    ),
    prisma.$queryRawUnsafe<
      Array<{
        id: string;
        scheduledAt: Date;
        durationMins: number;
        lessonType: string;
        transmission: string;
        studentName: string | null;
      }>
    >(
      `SELECT
           b.id,
           b."scheduledAt",
           b."durationMins",
           b."lessonType"::text AS "lessonType",
           b.transmission,
           u.name AS "studentName"
         FROM "Booking" b
         INNER JOIN users u ON u.id = b."studentId"
         WHERE b."instructorId" = $1
           AND b."scheduledAt" > $2::timestamp
           AND b."scheduledAt" < $3::timestamp
           AND b.status::text IN ('CONFIRMED', 'PENDING')
         ORDER BY b."scheduledAt" ASC
         LIMIT 10`,
      instructor.id,
      now.toISOString(),
      next7Days.toISOString()
    ),
  ]);

  const lessonsThisWeek = lessonsThisWeekRows[0]?.count ?? 0;
  const earningsThisMonth = monthBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);

  const uniqueStudentIds = new Set(allBookingsForStudents.map(b => b.studentId));
  const totalStudents = uniqueStudentIds.size;
  const area = instructor.areas?.[0] ?? '';

  return {
    lessonsThisWeek,
    earningsThisMonth,
    avgRating: instructor.rating,
    totalStudents,
    todayLessons: todayBookings.map(b => ({
      id: b.id,
      scheduledAt: b.scheduledAt.toISOString(),
      durationMins: b.durationMins,
      lessonType: b.lessonType,
      transmission: b.transmission,
      studentName: b.studentName,
      studentInitials: getInitials(b.studentName ?? ''),
    })),
    upcomingLessons: upcomingBookings.map(b => ({
      id: b.id,
      scheduledAt: b.scheduledAt.toISOString(),
      durationMins: b.durationMins,
      lessonType: b.lessonType,
      transmission: b.transmission,
      studentName: b.studentName,
      studentInitials: getInitials(b.studentName ?? ''),
      area,
    })),
  };
};

const PAGE_SIZE = 20;

// Fetch pending reschedule requests for a set of booking IDs
async function fetchPendingReschedules(bookingIds: string[]) {
  if (!bookingIds.length)
    return {} as Record<
      string,
      {
        id: string;
        requestedByRole: string;
        requesterName: string | null;
        proposedDateTime: Date;
        reason: string | null;
      }
    >;
  try {
    const placeholders = bookingIds.map((_, i) => `$${i + 1}`).join(', ');
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        bookingId: string;
        requestedByRole: string;
        requesterName: string | null;
        proposedDateTime: Date;
        reason: string | null;
      }>
    >(
      `SELECT r.id, r."bookingId", r."requestedByRole",
              u.name AS "requesterName", r."proposedDateTime", r.reason
       FROM "RescheduleRequest" r
       LEFT JOIN users u ON u.id = r."requestedByUserId"
       WHERE r."bookingId" IN (${placeholders}) AND r.status = 'PENDING'
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

const listMyBookings = async (userId: string, params: { status?: string; page?: number }) => {
  const instructorRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "Instructor" WHERE "userId" = $1 LIMIT 1`,
    userId
  );
  const instructor = instructorRows[0];
  if (!instructor) return { data: [], total: 0, page: 1, totalPages: 0 };

  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;
  const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
  const statusFilter = validStatuses.includes(params.status ?? '') ? (params.status ?? null) : null;

  const totalRows = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
    `SELECT COUNT(*)::int AS total FROM "Booking" b
     WHERE b."instructorId" = $1 AND ($2::text IS NULL OR b.status::text = $2)`,
    instructor.id,
    statusFilter
  );
  const total = totalRows[0]?.total ?? 0;

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
      notes: string | null;
      studentId: string;
      studentName: string | null;
      studentEmail: string;
    }>
  >(
    `SELECT b.id, b.reference, b."lessonType"::text AS "lessonType", b.transmission,
            b."scheduledAt", b."durationMins", b.status::text AS status,
            b."paymentStatus"::text AS "paymentStatus", b."totalAmount"::text AS "totalAmount", b.notes,
            s.id AS "studentId", s.name AS "studentName", s.email AS "studentEmail"
     FROM "Booking" b
     INNER JOIN users s ON s.id = b."studentId"
     WHERE b."instructorId" = $1 AND ($2::text IS NULL OR b.status::text = $2)
     ORDER BY b."scheduledAt" DESC
     OFFSET $3 LIMIT $4`,
    instructor.id,
    statusFilter,
    offset,
    PAGE_SIZE
  );

  const bookings = rows.map(b => ({
    id: b.id,
    reference: b.reference,
    lessonType: b.lessonType,
    transmission: b.transmission,
    scheduledAt: b.scheduledAt.toISOString(),
    durationMins: b.durationMins,
    status: b.status,
    paymentStatus: b.paymentStatus,
    totalAmount: Number(b.totalAmount),
    notes: b.notes,
    student: { id: b.studentId, name: b.studentName, email: b.studentEmail },
    pendingReschedule: null as null | {
      id: string;
      requestedByRole: string;
      requesterName: string | null;
      proposedDateTime: string;
      reason: string | null;
    },
  }));

  const pending = await fetchPendingReschedules(bookings.map(b => b.id));
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

  return { data: bookings, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
};

const cancelMyBooking = async (
  bookingId: string,
  userId: string,
  reason: string,
  notes?: string
) => {
  const instructorRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "Instructor" WHERE "userId" = $1 LIMIT 1`,
    userId
  );
  const instructor = instructorRows[0];
  if (!instructor) return { error: 'NOT_FOUND' as const };

  const bookingRows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      instructorId: string;
      status: string;
      paymentStatus: string;
      studentId: string;
    }>
  >(
    `SELECT id, "instructorId", status::text AS status, "paymentStatus"::text AS "paymentStatus", "studentId"
     FROM "Booking" WHERE id = $1 LIMIT 1`,
    bookingId
  );
  const booking = bookingRows[0];
  if (!booking) return { error: 'NOT_FOUND' as const };
  if (booking.instructorId !== instructor.id) return { error: 'FORBIDDEN' as const };
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) return { error: 'BAD_STATE' as const };

  const cancelNotes = [reason, notes].filter(Boolean).join(' — ') || null;

  await prisma.$executeRawUnsafe(
    `UPDATE "Booking" SET status = 'CANCELLED', notes = COALESCE($2::text, notes), "updatedAt" = NOW() WHERE id = $1`,
    bookingId,
    cancelNotes
  );

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "RescheduleRequest" SET status = 'CANCELLED', "updatedAt" = NOW() WHERE "bookingId" = $1 AND status = 'PENDING'`,
      bookingId
    );
  } catch {
    /* ignore */
  }

  // Always refund the student when the instructor cancels — not the student's fault
  let refundResult: { refunded: boolean; stripeRefundId?: string } = { refunded: false };
  if (booking.paymentStatus === 'PAID') {
    const result = await refundService.issueRefundForBooking(bookingId);
    if (result.refunded) {
      refundResult = { refunded: true, stripeRefundId: result.stripeRefundId };
    }
  }

  // Notify student (fire-and-forget)
  void (async () => {
    try {
      const details = await prisma.$queryRawUnsafe<
        Array<{
          reference: string;
          studentName: string;
          studentEmail: string;
          instructorName: string | null;
          lessonType: string;
          scheduledAt: Date;
          totalAmount: string;
          discountAmount: string | null;
        }>
      >(
        `SELECT b.reference,
                su.name AS "studentName", su.email AS "studentEmail",
                iu.name AS "instructorName",
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
      }
    } catch {
      /* email failure must not break cancellation */
    }
  })();

  return { data: { id: bookingId, status: 'CANCELLED' as const, refund: refundResult } };
};

export default {
  getInstructorProfileByUserId,
  updateInstructorProfileByUserId,
  getInstructorScheduleByUserId,
  replaceInstructorScheduleByUserId,
  getScheduleOverviewByUserId,
  getInstructorStudentsByUserId,
  getInstructorStatsByUserId,
  listMyBookings,
  cancelMyBooking,
};
