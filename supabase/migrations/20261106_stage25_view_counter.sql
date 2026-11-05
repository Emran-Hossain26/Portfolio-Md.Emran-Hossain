-- ============================================================================
-- Stage 2.5: Atomic view counter function (SECURITY DEFINER)
-- Run after 20261105_stage2_blog_columns.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_post_views(p_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
     SET view_count = view_count + 1
   WHERE slug = p_slug
     AND status = 'published';
END;
$$;

-- Revoke direct execution from anon/authenticated; only service role + SECURITY DEFINER callers
REVOKE ALL ON FUNCTION public.increment_post_views(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_post_views(text) TO service_role;