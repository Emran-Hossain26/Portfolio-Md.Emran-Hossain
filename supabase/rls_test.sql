-- ============================================================================
-- RLS verification script for the posts table.
-- Run as the anon role (or with SET ROLE anon) in the Supabase SQL Editor.
-- Expected results are documented in comments.
-- ============================================================================

-- 1. Anon can read published posts only.
--    Expected: returns only rows with status='published' and scheduled_at <= now().
SELECT id, slug, status, scheduled_at, view_count
FROM public.posts
ORDER BY created_at DESC;

-- 2. Anon cannot read drafts.
--    Expected: 0 rows (no draft rows returned).
SELECT count(*) AS draft_visible_to_anon
FROM public.posts
WHERE status = 'draft';

-- 3. Anon cannot read scheduled (future) posts.
--    Expected: 0 rows.
SELECT count(*) AS scheduled_visible_to_anon
FROM public.posts
WHERE status = 'scheduled' AND scheduled_at > now();

-- 4. Anon cannot write (insert/update/delete).
--    Expected: permission denied / RLS violation.
-- INSERT INTO public.posts (slug, title_en) VALUES ('hacked', 'hack');  -- should fail
-- UPDATE public.posts SET title_en = 'hacked' WHERE slug = 'harden-windows-server';  -- should fail
-- DELETE FROM public.posts WHERE slug = 'harden-windows-server';  -- should fail

-- 5. Anon cannot read other tables' protected rows (messages, audit_log).
--    Expected: 0 rows or permission denied.
SELECT count(*) AS messages_visible_to_anon FROM public.messages;
SELECT count(*) AS audit_log_visible_to_anon FROM public.audit_log;

-- 6. view_count is readable (it's public metadata) but only via the published rows.
--    Expected: view_count present on published rows, absent on drafts.
SELECT slug, view_count FROM public.posts WHERE status = 'published' LIMIT 5;

-- To run as anon explicitly:
-- SET ROLE anon;
-- <run queries above>
-- RESET ROLE;