-- Task U4: unified CMS lifecycle for projects / services ("What I Do") /
-- experience. Adds publication status (draft | published | unpublished |
-- archived), publish timestamps, SEO fields, module-specific content fields
-- and the content_revisions table.
--
-- The `published` boolean stays SYNCHRONISED (published = pub_status =
-- 'published' AND not trashed) so existing anon RLS read policies and older
-- queries keep working. Trash remains `deleted_at` (soft delete).
--
-- Self-sufficient: also (re)declares the Task U2 projects columns, so running
-- this one file is enough even if 20261117_projects_admin.sql was skipped.
-- Idempotent: safe to re-run. Run in Supabase SQL Editor (NOT run by agent).

-- ---------------------------------------------------------------------------
-- 1. projects — U2 columns (idempotent re-declare) + U4 columns
-- ---------------------------------------------------------------------------
alter table public.projects add column if not exists status text not null default 'completed';
alter table public.projects add column if not exists deleted_at timestamptz;
alter table public.projects add column if not exists featured boolean not null default false;
alter table public.projects add column if not exists live_url text not null default '';
alter table public.projects add column if not exists repo_url text not null default '';

alter table public.projects add column if not exists pub_status text not null default 'draft';
alter table public.projects add column if not exists published_at timestamptz;
alter table public.projects add column if not exists cover_url text not null default '';
alter table public.projects add column if not exists category text not null default '';
alter table public.projects add column if not exists project_type text not null default '';
alter table public.projects add column if not exists role_en text not null default '';
alter table public.projects add column if not exists role_bn text not null default '';
alter table public.projects add column if not exists features_en text not null default '';
alter table public.projects add column if not exists features_bn text not null default '';
alter table public.projects add column if not exists seo_title_en text not null default '';
alter table public.projects add column if not exists seo_title_bn text not null default '';
alter table public.projects add column if not exists seo_desc_en text not null default '';
alter table public.projects add column if not exists seo_desc_bn text not null default '';
alter table public.projects add column if not exists seo_keywords text not null default '';
alter table public.projects add column if not exists og_image text not null default '';
alter table public.projects add column if not exists canonical text not null default '';
alter table public.projects add column if not exists noindex boolean not null default false;

alter table public.projects drop constraint if exists projects_pub_status_check;
alter table public.projects add constraint projects_pub_status_check
  check (pub_status in ('draft', 'published', 'unpublished', 'archived'));
alter table public.projects drop constraint if exists projects_status_check;
alter table public.projects add constraint projects_status_check
  check (status in ('running', 'completed', 'planned', 'paused'));

-- Backfill: previously `published` was the only switch.
update public.projects set pub_status = 'published'
  where published = true and pub_status <> 'published';
update public.projects set pub_status = 'draft'
  where published = false and pub_status = 'published';

drop policy if exists projects_public_read on public.projects;
create policy projects_public_read on public.projects
  for select to anon, authenticated
  using (published = true and deleted_at is null and pub_status = 'published');

drop policy if exists projects_admin_write on public.projects;
create policy projects_admin_write on public.projects
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. services ("What I Do") — U4 columns
-- ---------------------------------------------------------------------------
alter table public.services add column if not exists pub_status text not null default 'draft';
alter table public.services add column if not exists published_at timestamptz;
alter table public.services add column if not exists full_desc_en text not null default '';
alter table public.services add column if not exists full_desc_bn text not null default '';
alter table public.services add column if not exists image_url text not null default '';
alter table public.services add column if not exists icon_svg text not null default '';
alter table public.services add column if not exists features_en text not null default '';
alter table public.services add column if not exists features_bn text not null default '';
alter table public.services add column if not exists tags text[] not null default '{}';
alter table public.services add column if not exists featured boolean not null default false;
alter table public.services add column if not exists seo_title_en text not null default '';
alter table public.services add column if not exists seo_title_bn text not null default '';
alter table public.services add column if not exists seo_desc_en text not null default '';
alter table public.services add column if not exists seo_desc_bn text not null default '';
alter table public.services add column if not exists seo_keywords text not null default '';
alter table public.services add column if not exists og_image text not null default '';
alter table public.services add column if not exists canonical text not null default '';
alter table public.services add column if not exists noindex boolean not null default false;

alter table public.services drop constraint if exists services_pub_status_check;
alter table public.services add constraint services_pub_status_check
  check (pub_status in ('draft', 'published', 'unpublished', 'archived'));

update public.services set pub_status = 'published'
  where published = true and pub_status <> 'published';
update public.services set pub_status = 'draft'
  where published = false and pub_status = 'published';

drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services
  for select to anon, authenticated
  using (published = true and deleted_at is null and pub_status = 'published');

drop policy if exists services_admin_write on public.services;
create policy services_admin_write on public.services
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. experience — currently has NO published/deleted_at at all
-- ---------------------------------------------------------------------------
alter table public.experience add column if not exists published boolean not null default true;
alter table public.experience add column if not exists deleted_at timestamptz;
alter table public.experience add column if not exists pub_status text not null default 'published';
alter table public.experience add column if not exists published_at timestamptz;
alter table public.experience add column if not exists logo_url text not null default '';
alter table public.experience add column if not exists website_url text not null default '';
alter table public.experience add column if not exists employment_type text not null default '';
alter table public.experience add column if not exists start_date text not null default '';
alter table public.experience add column if not exists end_date text not null default '';
alter table public.experience add column if not exists is_current boolean not null default false;
alter table public.experience add column if not exists summary_en text not null default '';
alter table public.experience add column if not exists summary_bn text not null default '';
alter table public.experience add column if not exists achievements_en text not null default '';
alter table public.experience add column if not exists achievements_bn text not null default '';
alter table public.experience add column if not exists tags text[] not null default '{}';
alter table public.experience add column if not exists featured boolean not null default false;
alter table public.experience add column if not exists seo_title_en text not null default '';
alter table public.experience add column if not exists seo_title_bn text not null default '';
alter table public.experience add column if not exists seo_desc_en text not null default '';
alter table public.experience add column if not exists seo_desc_bn text not null default '';
alter table public.experience add column if not exists seo_keywords text not null default '';
alter table public.experience add column if not exists og_image text not null default '';
alter table public.experience add column if not exists canonical text not null default '';
alter table public.experience add column if not exists noindex boolean not null default false;

alter table public.experience drop constraint if exists experience_pub_status_check;
alter table public.experience add constraint experience_pub_status_check
  check (pub_status in ('draft', 'published', 'unpublished', 'archived'));
alter table public.experience drop constraint if exists experience_employment_type_check;
alter table public.experience add constraint experience_employment_type_check
  check (employment_type in ('', 'full-time', 'part-time', 'freelance', 'contract'));

-- Existing rows were already public → backfill as published.
update public.experience set pub_status = 'published' where pub_status <> 'published';

-- experience had no RLS gate at all — add the standard contract.
alter table public.experience enable row level security;
drop policy if exists experience_public_read on public.experience;
create policy experience_public_read on public.experience
  for select to anon, authenticated
  using (published = true and deleted_at is null and pub_status = 'published');

drop policy if exists experience_admin_write on public.experience;
create policy experience_admin_write on public.experience
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. content_revisions — version history for all three modules.
--    Service-role writes only (RLS enabled, no anon/authenticated policies).
-- ---------------------------------------------------------------------------
create table if not exists public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('projects', 'services', 'experience')),
  entity_id uuid not null,
  revision_no int not null,
  old_value jsonb,
  new_value jsonb,
  admin_email text,
  created_at timestamptz not null default now(),
  unique (entity_id, revision_no)
);
alter table public.content_revisions enable row level security;
create index if not exists content_revisions_entity_idx
  on public.content_revisions (entity_id, revision_no desc);

-- ---------------------------------------------------------------------------
-- 5. Indexes for the dashboards
-- ---------------------------------------------------------------------------
create index if not exists projects_pub_status_idx on public.projects (pub_status, deleted_at);
create index if not exists services_pub_status_idx on public.services (pub_status, deleted_at);
create index if not exists experience_pub_status_idx on public.experience (pub_status, deleted_at);
create index if not exists projects_updated_idx on public.projects (updated_at desc);
create index if not exists services_updated_idx on public.services (updated_at desc);
create index if not exists experience_updated_idx on public.experience (updated_at desc);
