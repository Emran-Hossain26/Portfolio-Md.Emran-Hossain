-- Stage 6: enrichment modules (public features). Idempotent.
--  - sections table: keys aligned with the home page's data-sec names
--    (the sections manager finally gates/reorders the real homepage)
--  - projects: case-study result text + metrics jsonb
--  - services: free-form price string for the packages page
--  - now_items: "currently working on / learning / reading"
--  - booking_slots: consultation availability
--  - site_settings toggles for every new module (all default OFF unless noted)

-- 1) Sections keys: replace the stale 'testimonials' key with 'reviews' and
--    add the missing rendered sections (stats/certifications/faq/skills/now).
--    The content jsonb of existing keys is preserved.
insert into public.sections (key, sort_order, enabled)
values
  ('hero', 1, true),
  ('expertise', 2, true),
  ('skills', 3, true),
  ('stats', 4, true),
  ('projects', 5, true),
  ('certifications', 6, true),
  ('reviews', 7, true),
  ('faq', 8, true),
  ('now', 9, true),
  ('blog', 10, true),
  ('contact', 11, true)
on conflict (key) do nothing;

update public.sections set enabled = false where key = 'testimonials';

-- 2) Case-study results on projects
alter table public.projects add column if not exists result_en text;
alter table public.projects add column if not exists result_bn text;
alter table public.projects add column if not exists metrics jsonb;

-- 3) Services packages: free-form price line ("From ৳15,000 / project")
alter table public.services add column if not exists price text;

-- 4) "Now" items (working on / learning / reading)
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
-- Public read (anon), admin/service writes only.
drop policy if exists now_items_public_read on public.now_items;
create policy now_items_public_read on public.now_items
  for select to anon, authenticated
  using (published = true);

-- 5) Booking slots (consultation availability)
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

-- 6) Module toggles (site_settings) — newsletter/effects pattern.
--    skills/now are gated by the sections table instead (they are home
--    sections); the rest are non-section features.
insert into public.site_settings (key, value)
values
  ('terminal_settings', '{"enabled": true}'::jsonb),
  ('palette_settings', '{"enabled": true}'::jsonb),
  ('services_settings', '{"enabled": true, "quote_enabled": true}'::jsonb),
  ('booking_settings', '{"enabled": false}'::jsonb),
  ('github_widget', '{"enabled": false, "username": ""}'::jsonb),
  ('country_badge', '{"enabled": false}'::jsonb)
on conflict (key) do nothing;

-- 7) Stage 7: Vercel Speed Insights toggle (off by default)
insert into public.site_settings (key, value)
values ('speed_insights', '{"enabled": false}'::jsonb)
on conflict (key) do nothing;
