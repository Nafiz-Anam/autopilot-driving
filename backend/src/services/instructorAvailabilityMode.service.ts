import httpStatus from 'http-status';
import prisma from '../client';
import ApiError from '../utils/ApiError';
import emailService from './email.service';

const DEFAULT_TEMPLATE_START_HOUR = 8;
const DEFAULT_TEMPLATE_END_HOUR = 21;

const hasAvailableSlots = async (instructorId: string): Promise<boolean> => {
  const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT EXISTS(SELECT 1 FROM "Availability" WHERE "instructorId" = $1 AND "isAvailable" = true) AS exists`,
    instructorId
  );
  return rows[0]?.exists === true;
};

// No-op if the instructor already has any Availability rows -- only fills
// in a sane starting template (Mon-Sat 08:00-21:00) for someone with none,
// so switching to CUSTOM_SLOTS never silently zeroes out their bookability.
const seedDefaultTemplateIfEmpty = async (instructorId: string): Promise<void> => {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Availability" (id, "instructorId", "dayOfWeek", "startTime", "endTime", "isAvailable")
     SELECT gen_random_uuid()::text, $1, d.day, lpad(h.hour::text, 2, '0') || ':00:00', lpad((h.hour + 1)::text, 2, '0') || ':00:00', true
     FROM generate_series(1, 6) AS d(day)
     CROSS JOIN generate_series(${DEFAULT_TEMPLATE_START_HOUR}, ${DEFAULT_TEMPLATE_END_HOUR - 1}) AS h(hour)
     WHERE NOT EXISTS (SELECT 1 FROM "Availability" a WHERE a."instructorId" = $1)`,
    instructorId
  );
};

// Switching to CALENDAR_SYNC without a connected calendar just degrades to
// "fully open" (today's baseline for everyone) -- not blocked. Switching to
// CUSTOM_SLOTS with zero available rows would make the instructor entirely
// unbookable, so that direction is blocked unless the caller passes force.
const assertSafeModeSwitch = async (
  instructorId: string,
  newMode: 'CUSTOM_SLOTS' | 'CALENDAR_SYNC',
  force: boolean
): Promise<void> => {
  if (newMode !== 'CUSTOM_SLOTS' || force) return;
  const hasSlots = await hasAvailableSlots(instructorId);
  if (!hasSlots) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'EMPTY_TEMPLATE: instructor has no available slots configured; pass force=true to switch anyway'
    );
  }
};

// Called whenever a calendar integration is disconnected or disabled.
// If the instructor was in CALENDAR_SYNC mode they would become fully open
// 24/7 with no busy blocks — flip them back to CUSTOM_SLOTS and notify.
const autoFlipToCustomSlotsIfNeeded = async (userId: string): Promise<void> => {
  const rows = await prisma.$queryRawUnsafe<
    Array<{ id: string; availabilityMode: string; userEmail: string; userName: string | null }>
  >(
    `SELECT i.id, i."availabilityMode"::text AS "availabilityMode", u.email AS "userEmail", u.name AS "userName"
     FROM "Instructor" i
     INNER JOIN users u ON u.id = i."userId"
     WHERE i."userId" = $1
     LIMIT 1`,
    userId
  );
  const instructor = rows[0];
  if (!instructor || instructor.availabilityMode !== 'CALENDAR_SYNC') return;

  await prisma.instructor.update({
    where: { id: instructor.id },
    data: { availabilityMode: 'CUSTOM_SLOTS' },
  });
  await seedDefaultTemplateIfEmpty(instructor.id);

  await emailService
    .sendSecurityUpdateEmail(instructor.userEmail, {
      title: 'Your calendar disconnected — availability switched to manual',
      message: `Hi ${instructor.userName ?? ''}, your calendar connection was disconnected, so we've switched your booking availability to manual slot scheduling. Please review your weekly availability in your instructor dashboard so students can still book you.`,
    })
    .catch(() => {});
};

export default { assertSafeModeSwitch, seedDefaultTemplateIfEmpty, hasAvailableSlots, autoFlipToCustomSlotsIfNeeded };
