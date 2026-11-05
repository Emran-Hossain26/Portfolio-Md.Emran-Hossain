-- Stage 4.3 — Localized (Bangla) slugs for posts + per-project OG images.
-- Idempotent: safe to run more than once.
-- Run in Supabase SQL Editor AFTER 20250105, 20261105, 20261106 and 20261107.

-- 1) Optional Bangla slug for posts. Empty/NULL falls back to `slug`.
alter table public.posts
  add column if not exists bn_slug text;

comment on column public.posts.bn_slug is
  'Optional Bangla URL slug. /bn/blog/<bn_slug> when set; /bn/blog/<slug> still resolves.';

-- One non-empty bn_slug per row (partial unique index, NULLs exempt).
create unique index if not exists posts_bn_slug_key
  on public.posts (bn_slug)
  where bn_slug is not null and bn_slug <> '';

-- 2) Per-project social share image (absolute URL or storage path).
alter table public.projects
  add column if not exists og_image text;

comment on column public.projects.og_image is
  'Optional OG/Twitter share image for the project page. Falls back to the site default.';
