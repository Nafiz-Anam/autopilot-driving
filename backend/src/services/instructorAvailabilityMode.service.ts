import httpStatus from 'http-status';
import prisma from '../client';
import ApiError from '../utils/ApiError';

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

export default { assertSafeModeSwitch, seedDefaultTemplateIfEmpty, hasAvailableSlots };
