-- Stage: make `status` the only visibility control for posts.
-- The `published` boolean column is deprecated (kept in the schema for
-- backward compatibility but no longer read by code or RLS).
-- Idempotent: safe to re-run.

-- 1. Sync any rows where published=true but status is missing or empty.
--    (The two current rows already have status='published', but this
--    protects against legacy data.)
update public.posts
set status = 'published'
where published = true and (status is null or status = '');

-- 2. Drop and recreate the public read policy WITHOUT `published`.
drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts
  for select to anon, authenticated
  using (
    status = 'published'
    and (scheduled_at is null or scheduled_at <= now())
  );
