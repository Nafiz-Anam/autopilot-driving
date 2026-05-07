import prisma from '../client';

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
       u.image AS "userImage"
     FROM "Instructor" i
     INNER JOIN "User" u ON u.id = i."userId"
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

const updateInstructorProfileByUserId = async (
  userId: string,
  body: Record<string, unknown>
) => {
  const instructorRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "Instructor" WHERE "userId" = $1 LIMIT 1`,
    userId
  );
  const instructor = instructorRows[0];
  if (!instructor) return null;

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (body.bio !== undefined) {
    setClauses.push(`bio = $${idx}`);
    values.push(body.bio);
    idx += 1;
  }
  if (body.pricePerHour !== undefined) {
    setClauses.push(`"pricePerHour" = $${idx}`);
    values.push(body.pricePerHour);
    idx += 1;
  }
  if (body.areas !== undefined) {
    setClauses.push(`areas = $${idx}`);
    values.push(body.areas);
    idx += 1;
  }
  if (body.transmission !== undefined) {
    setClauses.push(`transmission = $${idx}`);
    values.push(body.transmission);
    idx += 1;
  }

  if (setClauses.length > 0) {
    await prisma.$executeRawUnsafe(
      `UPDATE "Instructor"
       SET ${setClauses.join(', ')}, "updatedAt" = NOW()
       WHERE id = $${idx}`,
      ...values,
      instructor.id
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

const replaceInstructorScheduleByUserId = async (userId: string, slots: AvailabilityInput[]) => {
  const instructorRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "Instructor" WHERE "userId" = $1 LIMIT 1`,
    userId
  );
  const instructor = instructorRows[0];
  if (!instructor) return null;

  await prisma.$executeRawUnsafe(`DELETE FROM "Availability" WHERE "instructorId" = $1`, instructor.id);

  if (slots.length > 0) {
    for (const slot of slots) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Availability" (
          id, "instructorId", "dayOfWeek", "startTime", "endTime", "isAvailable", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3::time, $4::time, $5, NOW(), NOW()
        )`,
        instructor.id,
        slot.dayOfWeek,
        slot.startTime,
        slot.endTime,
        slot.isAvailable
      );
    }
  }

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
       u.image AS "studentImage"
     FROM "Booking" b
     INNER JOIN "User" u ON u.id = b."studentId"
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

  const [lessonsThisWeekRows, monthBookings, allBookingsForStudents, todayBookings, upcomingBookings] =
    await Promise.all([
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
         INNER JOIN "User" u ON u.id = b."studentId"
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
         INNER JOIN "User" u ON u.id = b."studentId"
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
  const earningsThisMonth = monthBookings.reduce(
    (sum, b) => sum + Number(b.totalAmount),
    0
  );

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

export default {
  getInstructorProfileByUserId,
  updateInstructorProfileByUserId,
  getInstructorScheduleByUserId,
  replaceInstructorScheduleByUserId,
  getInstructorStudentsByUserId,
  getInstructorStatsByUserId,
};
