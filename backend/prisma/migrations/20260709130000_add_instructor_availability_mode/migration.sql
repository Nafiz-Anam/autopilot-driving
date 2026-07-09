-- Instructors get a per-instructor availabilityMode: CUSTOM_SLOTS (weekly
-- Availability template drives booking) or CALENDAR_SYNC (current behavior,
-- synced Google/Apple Calendar busy blocks drive booking). CUSTOM_SLOTS is
-- the new product default going forward.

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AvailabilityMode') THEN
        CREATE TYPE "AvailabilityMode" AS ENUM ('CUSTOM_SLOTS', 'CALENDAR_SYNC');
    END IF;
END $$;

ALTER TABLE "Instructor" ADD COLUMN IF NOT EXISTS "availabilityMode" "AvailabilityMode" NOT NULL DEFAULT 'CUSTOM_SLOTS';

-- Preserve current live behavior for instructors who already rely on a
-- connected Google Calendar: keep them on CALENDAR_SYNC rather than
-- silently switching them to an unconfigured slot template.
UPDATE "Instructor" i
SET "availabilityMode" = 'CALENDAR_SYNC'
WHERE EXISTS (
    SELECT 1 FROM "UserIntegration" ui
    WHERE ui."userId" = i."userId"
      AND ui.provider = 'google_calendar'
      AND ui.enabled = true
);

-- Everyone else lands on the new CUSTOM_SLOTS default. An instructor with
-- zero existing Availability rows would otherwise show zero bookable slots,
-- which is worse than today's baseline -- seed a sane default weekly
-- template (Mon-Sat 08:00-21:00) so nobody currently bookable becomes
-- unbookable purely because of this migration.
INSERT INTO "Availability" (id, "instructorId", "dayOfWeek", "startTime", "endTime", "isAvailable")
SELECT gen_random_uuid()::text, i.id, d.day, lpad(h.hour::text, 2, '0') || ':00:00', lpad((h.hour + 1)::text, 2, '0') || ':00:00', true
FROM "Instructor" i
CROSS JOIN generate_series(1, 6) AS d(day)
CROSS JOIN generate_series(8, 20) AS h(hour)
WHERE i."availabilityMode" = 'CUSTOM_SLOTS'
  AND NOT EXISTS (SELECT 1 FROM "Availability" a WHERE a."instructorId" = i.id);
