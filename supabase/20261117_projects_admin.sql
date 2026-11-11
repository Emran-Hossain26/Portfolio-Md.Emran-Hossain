-- Stage U2: "My Projects" admin upgrade.
-- Adds a status lifecycle, soft delete (trash), featured flag and link
-- columns. `published` stays the single "visible on portfolio" switch.
-- Idempotent: safe to re-run. Run in Supabase SQL Editor (NOT run by agent).

-- ---------------------------------------------------------------------------
-- 1. New columns
-- ---------------------------------------------------------------------------
alter table public.projects add column if not exists status text not null default 'completed';
alter table public.projects add column if not exists deleted_at timestamptz;
alter table public.projects add column if not exists featured boolean not null default false;
alter table public.projects add column if not exists live_url text not null default '';
alter table public.projects add column if not exists repo_url text not null default '';

-- status lifecycle: running | completed | planned | paused
alter table public.projects drop constraint if exists projects_status_check;
alter table public.projects add constraint projects_status_check
  check (status in ('running', 'completed', 'planned', 'paused'));

-- Backfill legacy rows (column default already covers most cases).
update public.projects set status = 'completed' where status is null or status = '';

-- ---------------------------------------------------------------------------
-- 2. RLS — public read hides hidden AND trashed rows; writes stay admin-only
--    (same contract as 20261112_admin_write_policies). Public pages read via
--    the service client, which bypasses RLS — the query-level filters in
--    cms.ts are the primary gate; this policy matches them for defense.
-- ---------------------------------------------------------------------------
drop policy if exists projects_public_read on public.projects;
create policy projects_public_read on public.projects
  for select to anon, authenticated
  using (published = true and deleted_at is null);

drop policy if exists projects_admin_write on public.projects;
create policy projects_admin_write on public.projects
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Indexes for the admin lists and the public ordering
-- ---------------------------------------------------------------------------
create index if not exists projects_public_list_idx
  on public.projects (deleted_at, published, sort_order);
create index if not exists projects_status_idx
  on public.projects (status);
