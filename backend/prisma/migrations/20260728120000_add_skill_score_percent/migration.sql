-- Add manual per-topic scoring percentage to skill_scores
DO $$ BEGIN
  ALTER TABLE "skill_scores" ADD COLUMN "score_percent" INTEGER;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;
