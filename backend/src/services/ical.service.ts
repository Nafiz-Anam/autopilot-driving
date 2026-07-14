import ical, { ICalCalendarMethod } from 'ical-generator';
import prisma from '../client';

/**
 * Generates a single-event ICS string for a booking confirmation email.
 * Uses method=REQUEST so Apple Mail / Gmail show "Add to Calendar" inline.
 */
function generateBookingIcs(params: {
  bookingId: string;
  reference: string;
  studentName: string;
  studentEmail: string;
  instructorName: string;
  lessonType: string;
  scheduledAt: Date;
  durationMins: number;
  totalAmount: number;
}): string {
  const cal = ical({
    name: 'Autopilot Driving School',
    method: ICalCalendarMethod.REQUEST,
  });

  const end = new Date(params.scheduledAt.getTime() + params.durationMins * 60 * 1000);

  cal.createEvent({
    id: `booking-${params.bookingId}@autopilotdrivingschool.co.uk`,
    start: params.scheduledAt,
    end,
    summary: `Driving Lesson — ${formatLessonType(params.lessonType)}`,
    description: `Booking reference: ${params.reference}\nInstructor: ${params.instructorName}\nDuration: ${params.durationMins / 60}hr\nAmount: £${params.totalAmount.toFixed(2)}`,
    organizer: { name: 'Autopilot Driving School', email: 'noreply@autopilotdrivingschool.co.uk' },
    attendees: [{ name: params.studentName, email: params.studentEmail, rsvp: false }],
  });

  return cal.toString();
}

/**
 * Generates a live ICS feed for an instructor's upcoming bookings.
 * Served at the webcal:// subscription URL.
 */
async function generateInstructorFeedIcs(instructorId: string): Promise<string | null> {
  const instructor = await prisma.$queryRawUnsafe<
    Array<{ instructorId: string; instructorName: string }>
  >(
    `SELECT i.id AS "instructorId", u.name AS "instructorName"
     FROM "Instructor" i
     INNER JOIN users u ON u.id = i."userId"
     WHERE i.id = $1 LIMIT 1`,
    instructorId
  );

  if (!instructor[0]) return null;

  const bookings = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      reference: string;
      lessonType: string;
      scheduledAt: Date;
      durationMins: number;
      studentName: string | null;
    }>
  >(
    `SELECT b.id, b.reference, b."lessonType", b."scheduledAt", b."durationMins",
            u.name AS "studentName"
     FROM "Booking" b
     INNER JOIN users u ON u.id = b."studentId"
     WHERE b."instructorId" = $1
       AND b.status IN ('CONFIRMED', 'PENDING')
       AND b."scheduledAt" >= NOW()
     ORDER BY b."scheduledAt" ASC`,
    instructorId
  );

  const cal = ical({ name: 'Autopilot — My Lessons' });

  for (const b of bookings) {
    const start = new Date(b.scheduledAt);
    const end = new Date(start.getTime() + b.durationMins * 60 * 1000);
    cal.createEvent({
      id: `booking-${b.id}@autopilotdrivingschool.co.uk`,
      start,
      end,
      summary: `Lesson — ${b.studentName ?? 'Student'} (${formatLessonType(b.lessonType)})`,
      description: `Booking ref: ${b.reference}\nLesson type: ${formatLessonType(b.lessonType)}`,
    });
  }

  return cal.toString();
}

function formatLessonType(type: string): string {
  const map: Record<string, string> = {
    MANUAL: 'Manual',
    AUTOMATIC: 'Automatic',
    INTENSIVE: 'Intensive',
    REFRESHER: 'Refresher',
    PASS_PLUS: 'Pass Plus',
    THEORY: 'Theory',
    MOTORWAY: 'Motorway',
    MOCK_TEST: 'Mock Test',
  };
  return map[type] ?? type;
}

/**
 * Generates a live ICS feed for a student's upcoming bookings.
 * Served at the webcal:// subscription URL.
 */
async function generateStudentFeedIcs(studentId: string): Promise<string | null> {
  const student = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
    `SELECT name FROM users WHERE id = $1 LIMIT 1`,
    studentId
  );
  if (!student[0]) return null;

  const bookings = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      reference: string;
      lessonType: string;
      scheduledAt: Date;
      durationMins: number;
      instructorName: string | null;
    }>
  >(
    `SELECT b.id, b.reference, b."lessonType", b."scheduledAt", b."durationMins",
            u.name AS "instructorName"
     FROM "Booking" b
     INNER JOIN "Instructor" i ON i.id = b."instructorId"
     INNER JOIN users u ON u.id = i."userId"
     WHERE b."studentId" = $1
       AND b.status IN ('CONFIRMED', 'PENDING')
       AND b."scheduledAt" >= NOW()
     ORDER BY b."scheduledAt" ASC`,
    studentId
  );

  const cal = ical({ name: 'Autopilot — My Driving Lessons' });

  for (const b of bookings) {
    const start = new Date(b.scheduledAt);
    const end = new Date(start.getTime() + b.durationMins * 60 * 1000);
    cal.createEvent({
      id: `booking-${b.id}@autopilotdrivingschool.co.uk`,
      start,
      end,
      summary: `Driving Lesson — ${formatLessonType(b.lessonType)}`,
      description: `Booking ref: ${b.reference}\nInstructor: ${b.instructorName ?? 'Autopilot Instructor'}\nDuration: ${b.durationMins / 60}hr`,
    });
  }

  return cal.toString();
}

export default { generateBookingIcs, generateInstructorFeedIcs, generateStudentFeedIcs };
