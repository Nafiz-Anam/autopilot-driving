-- Create SkillCompetencyLevel enum
DO $$ BEGIN
  CREATE TYPE "SkillCompetencyLevel" AS ENUM ('NOT_COVERED', 'NEEDS_PRACTICE', 'UNDER_INSTRUCTION', 'INDEPENDENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable: driving_skills (fixed checklist, seeded below)
CREATE TABLE IF NOT EXISTS "driving_skills" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driving_skills_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "driving_skills_key_key" ON "driving_skills"("key");

-- CreateTable: lesson_progress_reports (one per completed booking)
CREATE TABLE IF NOT EXISTS "lesson_progress_reports" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "overall_notes" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_progress_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lesson_progress_reports_booking_id_key" ON "lesson_progress_reports"("booking_id");
CREATE INDEX IF NOT EXISTS "lesson_progress_reports_student_id_published_idx" ON "lesson_progress_reports"("student_id", "published");
CREATE INDEX IF NOT EXISTS "lesson_progress_reports_instructor_id_idx" ON "lesson_progress_reports"("instructor_id");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lesson_progress_reports_booking_id_fkey') THEN
        ALTER TABLE "lesson_progress_reports" ADD CONSTRAINT "lesson_progress_reports_booking_id_fkey"
        FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lesson_progress_reports_student_id_fkey') THEN
        ALTER TABLE "lesson_progress_reports" ADD CONSTRAINT "lesson_progress_reports_student_id_fkey"
        FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lesson_progress_reports_instructor_id_fkey') THEN
        ALTER TABLE "lesson_progress_reports" ADD CONSTRAINT "lesson_progress_reports_instructor_id_fkey"
        FOREIGN KEY ("instructor_id") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_lesson_progress_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lesson_progress_reports_updated_at_trigger ON "lesson_progress_reports";
CREATE TRIGGER lesson_progress_reports_updated_at_trigger
  BEFORE UPDATE ON "lesson_progress_reports"
  FOR EACH ROW EXECUTE FUNCTION update_lesson_progress_reports_updated_at();

-- CreateTable: skill_scores (per-skill score within a report)
CREATE TABLE IF NOT EXISTS "skill_scores" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "level" "SkillCompetencyLevel" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "skill_scores_report_id_skill_id_key" ON "skill_scores"("report_id", "skill_id");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skill_scores_report_id_fkey') THEN
        ALTER TABLE "skill_scores" ADD CONSTRAINT "skill_scores_report_id_fkey"
        FOREIGN KEY ("report_id") REFERENCES "lesson_progress_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skill_scores_skill_id_fkey') THEN
        ALTER TABLE "skill_scores" ADD CONSTRAINT "skill_scores_skill_id_fkey"
        FOREIGN KEY ("skill_id") REFERENCES "driving_skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_skill_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS skill_scores_updated_at_trigger ON "skill_scores";
CREATE TRIGGER skill_scores_updated_at_trigger
  BEFORE UPDATE ON "skill_scores"
  FOR EACH ROW EXECUTE FUNCTION update_skill_scores_updated_at();

-- Seed the fixed 20-item driving skills checklist
INSERT INTO "driving_skills" ("id", "key", "name", "sort_order") VALUES
    ('skill_cockpit_checks', 'COCKPIT_CHECKS', 'Cockpit Checks', 0),
    ('skill_safety_checks', 'SAFETY_CHECKS', 'Safety Checks', 1),
    ('skill_car_control', 'CAR_CONTROL', 'Car Control', 2),
    ('skill_moving_and_stopping', 'MOVING_AND_STOPPING', 'Moving & Stopping', 3),
    ('skill_safe_positioning', 'SAFE_POSITIONING', 'Safe Positioning', 4),
    ('skill_use_of_mirrors', 'USE_OF_MIRRORS', 'Use of Mirrors', 5),
    ('skill_signalling', 'SIGNALLING', 'Signalling', 6),
    ('skill_planning_and_anticipating', 'PLANNING_AND_ANTICIPATING', 'Planning & Anticipating', 7),
    ('skill_one_way_narrow_roads', 'ONE_WAY_NARROW_ROADS', 'One-Way/Narrow Roads', 8),
    ('skill_junctions', 'JUNCTIONS', 'Junctions', 9),
    ('skill_roundabouts', 'ROUNDABOUTS', 'Roundabouts', 10),
    ('skill_crossings', 'CROSSINGS', 'Crossings', 11),
    ('skill_dual_carriageways', 'DUAL_CARRIAGEWAYS', 'Dual Carriageways', 12),
    ('skill_turning_the_car_around', 'TURNING_THE_CAR_AROUND', 'Turning the Car Around', 13),
    ('skill_reversing', 'REVERSING', 'Reversing', 14),
    ('skill_parking', 'PARKING', 'Parking', 15),
    ('skill_emergency_stop', 'EMERGENCY_STOP', 'Emergency Stop', 16),
    ('skill_driving_in_the_dark', 'DRIVING_IN_THE_DARK', 'Driving in the Dark', 17),
    ('skill_weather_conditions', 'WEATHER_CONDITIONS', 'Weather Conditions', 18),
    ('skill_car_security', 'CAR_SECURITY', 'Car Security', 19)
ON CONFLICT ("key") DO NOTHING;
