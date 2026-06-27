ALTER TABLE "InstructorApplication" ADD COLUMN IF NOT EXISTS "applicantType" TEXT NOT NULL DEFAULT 'already_instructor';
