-- UserIntegration: adopt existing prod table + add new columns for calendar sync
CREATE TABLE IF NOT EXISTS "UserIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "encryptedToken" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "syncCalendarId" TEXT NOT NULL DEFAULT 'primary',
    "externalEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserIntegration_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "UserIntegration" ADD COLUMN IF NOT EXISTS "syncCalendarId" TEXT NOT NULL DEFAULT 'primary';
ALTER TABLE "UserIntegration" ADD COLUMN IF NOT EXISTS "externalEmail" TEXT;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UserIntegration_userId_provider_key'
    ) THEN
        ALTER TABLE "UserIntegration" ADD CONSTRAINT "UserIntegration_userId_provider_key" UNIQUE ("userId", "provider");
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UserIntegration_userId_fkey'
    ) THEN
        ALTER TABLE "UserIntegration" ADD CONSTRAINT "UserIntegration_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- CalendarWatch: per-user Google events.watch channel
CREATE TABLE IF NOT EXISTS "CalendarWatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,
    "syncToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CalendarWatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CalendarWatch_channelId_key" ON "CalendarWatch"("channelId");
CREATE INDEX IF NOT EXISTS "CalendarWatch_expiration_idx" ON "CalendarWatch"("expiration");
CREATE INDEX IF NOT EXISTS "CalendarWatch_userId_provider_idx" ON "CalendarWatch"("userId", "provider");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CalendarWatch_userId_fkey') THEN
        ALTER TABLE "CalendarWatch" ADD CONSTRAINT "CalendarWatch_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- InstructorBusyBlock: cached external calendar busy blocks
CREATE TABLE IF NOT EXISTS "InstructorBusyBlock" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'google',
    "externalId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InstructorBusyBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "InstructorBusyBlock_instructorId_source_externalId_key"
    ON "InstructorBusyBlock"("instructorId", "source", "externalId");
CREATE INDEX IF NOT EXISTS "InstructorBusyBlock_instructorId_startsAt_endsAt_idx"
    ON "InstructorBusyBlock"("instructorId", "startsAt", "endsAt");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InstructorBusyBlock_instructorId_fkey') THEN
        ALTER TABLE "InstructorBusyBlock" ADD CONSTRAINT "InstructorBusyBlock_instructorId_fkey"
        FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Booking overlap kill: generated end column + gist EXCLUDE
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
    ADD COLUMN IF NOT EXISTS "endsAt" TIMESTAMP GENERATED ALWAYS AS
        ("scheduledAt" + ("durationMins" || ' minutes')::interval) STORED;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_no_overlap') THEN
        ALTER TABLE "Booking" ADD CONSTRAINT booking_no_overlap
            EXCLUDE USING gist (
                "instructorId" WITH =,
                tstzrange("scheduledAt"::timestamptz, "endsAt"::timestamptz) WITH &&
            )
            WHERE (status IN ('PENDING','CONFIRMED') AND "instructorId" IS NOT NULL);
    END IF;
END $$;
