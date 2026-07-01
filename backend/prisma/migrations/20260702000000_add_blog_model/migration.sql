-- CreateTable
CREATE TABLE IF NOT EXISTS "blogs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content_html" TEXT NOT NULL DEFAULT '',
    "content_json" JSONB,
    "excerpt" TEXT,
    "cover_image" TEXT,
    "author_name" TEXT NOT NULL DEFAULT 'Autopilot Team',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "tags" TEXT[],
    "read_time_minutes" INT NOT NULL DEFAULT 0,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "blogs_slug_key" ON "blogs"("slug");

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_blogs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blogs_updated_at_trigger ON "blogs";
CREATE TRIGGER blogs_updated_at_trigger
  BEFORE UPDATE ON "blogs"
  FOR EACH ROW EXECUTE FUNCTION update_blogs_updated_at();
