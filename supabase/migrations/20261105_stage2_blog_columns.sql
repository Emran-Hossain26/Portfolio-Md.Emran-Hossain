-- ============================================================================
-- Stage 2: Blog enhancements — new columns on posts
-- Run after 20250104_initial_schema.sql (and 20250105_stage1_content_tables.sql)
-- Idempotent: safe to re-run.
-- ============================================================================

ALTER TABLE posts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_title_en text NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_title_bn text NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_desc_en text NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_desc_bn text NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS og_image text NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS canonical text NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS noindex boolean NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count int NOT NULL DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status);
CREATE INDEX IF NOT EXISTS posts_scheduled_idx ON posts(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS posts_tags_idx ON posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS posts_categories_idx ON posts USING GIN(categories);

-- Backfill status from published flag for existing rows
UPDATE posts SET status = CASE WHEN published THEN 'published' ELSE 'draft' END WHERE status IS NULL OR status = '';

-- RLS (already enabled on posts from 20250104; ensure anon reads only published)
-- (existing policy posts_public_read already filters published=true; add status filter)
DROP POLICY IF EXISTS posts_public_read ON posts;
CREATE POLICY posts_public_read ON posts FOR SELECT TO anon, authenticated
  USING (published = true AND status = 'published' AND (scheduled_at IS NULL OR scheduled_at <= now()));

-- Admin write (already exists; recreate for safety)
DROP POLICY IF EXISTS posts_admin_write ON posts;
CREATE POLICY posts_admin_write ON posts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);