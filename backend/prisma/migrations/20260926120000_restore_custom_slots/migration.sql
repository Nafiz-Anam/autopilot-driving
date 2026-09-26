-- Custom Slots availability mode is being restored alongside Calendar Sync.
-- Instructors get back a per-instructor availabilityMode: CUSTOM_SLOTS (weekly
-- Availability template drives booking, the new default) or CALENDAR_SYNC
-- (synced Google/Apple Calendar busy blocks drive booking).

-- CreateEnum
CREATE TYPE "AvailabilityMode" AS ENUM ('CUSTOM_SLOTS', 'CALENDAR_SYNC');

-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN "availabilityMode" "AvailabilityMode" NOT NULL DEFAULT 'CUSTOM_SLOTS';

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve current behavior for instructors who already rely on a connected
-- Google/Apple Calendar: keep them on CALENDAR_SYNC rather than silently
-- switching them to an unconfigured slot template.
UPDATE "Instructor" i
SET "availabilityMode" = 'CALENDAR_SYNC'
WHERE EXISTS (
    SELECT 1 FROM "UserIntegration" ui
    WHERE ui."userId" = i."userId"
      AND ui.provider IN ('google_calendar', 'apple_ics')
      AND ui.enabled = true
);

-- Everyone else lands on the new CUSTOM_SLOTS default. Seed a sane default
-- weekly template (Mon-Sat 08:00-21:00) so nobody currently bookable becomes
-- unbookable purely because of this migration.
INSERT INTO "Availability" (id, "instructorId", "dayOfWeek", "startTime", "endTime", "isAvailable")
SELECT gen_random_uuid()::text, i.id, d.day, lpad(h.hour::text, 2, '0') || ':00:00', lpad((h.hour + 1)::text, 2, '0') || ':00:00', true
FROM "Instructor" i
CROSS JOIN generate_series(1, 6) AS d(day)
CROSS JOIN generate_series(8, 20) AS h(hour)
WHERE i."availabilityMode" = 'CUSTOM_SLOTS'
  AND NOT EXISTS (SELECT 1 FROM "Availability" a WHERE a."instructorId" = i.id);
