-- Legacy DB gaps discovered during the Task U4 walkthrough (2026-11-13).
-- This dev database predates several earlier migrations, so the CMS code
-- expected columns/tables that did not exist. All statements are additive
-- and idempotent. Run via: supabase db query --remote --yes --file <this>

-- 1. projects: case-study columns (Stage 6 #1, migration 20261113 never landed here)
alter table public.projects add column if not exists result_en text;
alter table public.projects add column if not exists result_bn text;
alter table public.projects add column if not exists metrics jsonb;

-- 2. services: price line (Stage 6 services page)
alter table public.services add column if not exists price text not null default '';

-- 3. experience: slug (U4 CMS identity) — backfill from role_en, deduped
alter table public.experience add column if not exists created_at timestamptz not null default now();
alter table public.experience add column if not exists slug text not null default '';
with b as (
  select id,
    lower(regexp_replace(regexp_replace(role_en, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')) as base,
    row_number() over (
      partition by lower(regexp_replace(regexp_replace(role_en, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'))
      order by created_at
    ) as rn
  from public.experience
)
update public.experience e
set slug = case when b.rn = 1 then b.base else b.base || '-' || b.rn end
from b
where e.id = b.id and (e.slug = '' or e.slug is null);
create unique index if not exists experience_slug_key on public.experience (slug);

-- 4. now_items — "Now" homepage section (APPLY_MISSING_TABLES, was never run)
create table if not exists public.now_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'working' check (kind in ('working','learning','reading')),
  text_en text not null default '',
  text_bn text not null default '',
  published boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.now_items enable row level security;
drop policy if exists now_items_public_read on public.now_items;
create policy now_items_public_read on public.now_items
  for select to anon, authenticated
  using (published = true);

-- 5. booking_slots — consultation availability
create table if not exists public.booking_slots (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null,
  slot_time text not null default '',
  capacity int not null default 1,
  booked int not null default 0,
  note text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.booking_slots enable row level security;
drop policy if exists booking_slots_public_read on public.booking_slots;
create policy booking_slots_public_read on public.booking_slots
  for select to anon, authenticated
  using (published = true);

-- 6. login_attempts — durable rate limiting (was silently no-op)
create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  ip text not null default '',
  success boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists login_attempts_lookup_idx
  on public.login_attempts (identifier, created_at desc);
alter table public.login_attempts enable row level security;
