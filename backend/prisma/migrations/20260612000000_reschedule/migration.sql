-- Add NO_SHOW to BookingStatus enum
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'NO_SHOW';

-- Add PARTIAL_REFUND to PaymentStatus enum
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PARTIAL_REFUND';

-- Add booking notification types
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BOOKING_CANCELLED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BOOKING_RESCHEDULED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'RESCHEDULE_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'RESCHEDULE_RESPONDED';

-- Create RescheduleStatus enum
DO $$ BEGIN
  CREATE TYPE "RescheduleStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create RescheduleRequest table
CREATE TABLE IF NOT EXISTS "RescheduleRequest" (
  "id"                TEXT NOT NULL,
  "bookingId"         TEXT NOT NULL,
  "requestedByUserId" TEXT NOT NULL,
  "requestedByRole"   TEXT NOT NULL,
  "proposedDateTime"  TIMESTAMP(3) NOT NULL,
  "reason"            TEXT,
  "notes"             TEXT,
  "status"            "RescheduleStatus" NOT NULL DEFAULT 'PENDING',
  "respondedAt"       TIMESTAMP(3),
  "respondedByUserId" TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RescheduleRequest_pkey" PRIMARY KEY ("id")
);

-- Foreign key constraints (idempotent)
DO $$ BEGIN
  ALTER TABLE "RescheduleRequest"
    ADD CONSTRAINT "RescheduleRequest_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "RescheduleRequest"
    ADD CONSTRAINT "RescheduleRequest_requestedByUserId_fkey"
    FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "RescheduleRequest_bookingId_idx"       ON "RescheduleRequest"("bookingId");
CREATE INDEX IF NOT EXISTS "RescheduleRequest_requestedBy_idx"     ON "RescheduleRequest"("requestedByUserId");
CREATE INDEX IF NOT EXISTS "RescheduleRequest_status_idx"          ON "RescheduleRequest"("status");
