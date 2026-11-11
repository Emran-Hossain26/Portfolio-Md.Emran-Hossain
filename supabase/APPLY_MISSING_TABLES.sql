-- Stage C: 4 missing tables — apply AFTER a backup.
-- Idempotent: safe to re-run. Run this in Supabase SQL Editor yourself.
-- These tables enable: audit log viewer, durable login lockout,
-- "Now" homepage section, and consultation booking.

-- 1. audit_log — records every admin save/delete/login event
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  user_email text,
  action text not null,
  entity_type text,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create index if not exists audit_log_created_at_idx
  on public.audit_log (created_at desc);

-- 2. login_attempts — durable rate limiting for the login form
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

-- 3. now_items — "currently working on / learning / reading" homepage section
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

-- 4. booking_slots — consultation availability
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
